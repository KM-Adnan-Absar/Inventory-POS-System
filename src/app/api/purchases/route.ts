import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";

import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";
import { createActivityLog } from "@/src/lib/create-activity-log";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if (!hasPermission(user.role ?? "", "manageInventory")) {
      return NextResponse.json(
        { message: "You do not have permission." },
        { status: 403 }
      );
    }

    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      total: purchases.length,
      purchases,
    });
  } catch (error) {
    console.error("GET PURCHASES ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch purchases." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if (!hasPermission(user.role ?? "", "manageInventory")) {
      return NextResponse.json(
        { message: "You do not have permission." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const supplierId = Number(body.supplierId);
    const discount = Number(body.discount ?? 0);
    const paidAmount = Number(body.paidAmount ?? 0);

    const items = body.items;

    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      return NextResponse.json(
        { message: "Valid supplier is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "At least one product is required." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(discount) ||
      discount < 0 ||
      !Number.isFinite(paidAmount) ||
      paidAmount < 0
    ) {
      return NextResponse.json(
        { message: "Invalid discount or paid amount." },
        { status: 400 }
      );
    }

    const productIds = items.map((item) => Number(item.productId));

    if (
      productIds.some(
        (id) => !Number.isInteger(id) || id <= 0
      ) ||
      new Set(productIds).size !== productIds.length
    ) {
      return NextResponse.json(
        { message: "Invalid or duplicate product." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findFirst({
        where: {
          id: supplierId,
          isActive: true,
        },
      });

      if (!supplier) {
        throw new Error("SUPPLIER_NOT_FOUND");
      }

      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
      });

      if (products.length !== items.length) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      let subtotal = new Prisma.Decimal(0);

      const purchaseItems = items.map((item) => {
        const product = products.find(
          (p) => p.id === Number(item.productId)
        );

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        const quantity = Number(item.quantity);
        const costPrice = Number(item.costPrice);

        if (
          !Number.isInteger(quantity) ||
          quantity <= 0 ||
          !Number.isFinite(costPrice) ||
          costPrice <= 0
        ) {
          throw new Error("INVALID_PURCHASE_ITEM");
        }

        const lineTotal = new Prisma.Decimal(costPrice).mul(quantity);

        subtotal = subtotal.add(lineTotal);

        return {
          product,
          quantity,
          costPrice: new Prisma.Decimal(costPrice),
          lineTotal,
        };
      });

      const discountAmount = new Prisma.Decimal(discount);
      const total = subtotal.sub(discountAmount);

      if (total.lessThan(0)) {
        throw new Error("INVALID_DISCOUNT");
      }

      const paid = new Prisma.Decimal(paidAmount);

      if (paid.greaterThan(total)) {
        throw new Error("PAID_AMOUNT_EXCEEDS_TOTAL");
      }

      const dueAmount = total.sub(paid);

      const purchase = await tx.purchase.create({
        data: {
          invoiceNumber: `PUR-${crypto.randomUUID()}`,
          supplierId,
          createdById: user.id,
          subtotal,
          discount: discountAmount,
          total,
          paidAmount: paid,
          dueAmount,
          items: {
            create: purchaseItems.map((item) => ({
              productId: item.product.id,
              productName: item.product.name,
              sku: item.product.sku,
              quantity: item.quantity,
              costPrice: item.costPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: {
          supplier: true,
          items: true,
        },
      });

      for (const item of purchaseItems) {
        const updatedProduct = await tx.product.update({
          where: { id: item.product.id },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.product.id,
            type: "STOCK_IN",
            quantity: item.quantity,
            previousStock: updatedProduct.stock - item.quantity,
            newStock: updatedProduct.stock,
            note: `Purchase ${purchase.invoiceNumber}`,
            createdById: user.id,
          },
        });
      }

      return purchase;
    });

    // Create Purchase Activity Log
    await createActivityLog({
      userId: user.id,
      action: "CREATE",
      entity: "PURCHASE",
      entityId: String(result.id),
      description: `Created purchase: ${result.invoiceNumber}`,
      metadata: {
        invoiceNumber: result.invoiceNumber,
        supplierId: result.supplierId,
        supplierName: result.supplier.name,
        total: result.total.toString(),
        paidAmount: result.paidAmount.toString(),
        itemCount: result.items.length,
      },
    });

    return NextResponse.json(
      {
        message: "Purchase created successfully.",
        purchase: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE PURCHASE ERROR:", error);

    const knownErrors: Record<string, { message: string; status: number }> = {
      SUPPLIER_NOT_FOUND: {
        message: "Supplier not found or inactive.",
        status: 404,
      },
      PRODUCT_NOT_FOUND: {
        message: "One or more products not found or inactive.",
        status: 404,
      },
      INVALID_PURCHASE_ITEM: {
        message: "Invalid product quantity or cost price.",
        status: 400,
      },
      INVALID_DISCOUNT: {
        message: "Discount cannot exceed subtotal.",
        status: 400,
      },
      PAID_AMOUNT_EXCEEDS_TOTAL: {
        message: "Paid amount cannot exceed purchase total.",
        status: 400,
      },
    };

    if (error instanceof Error && knownErrors[error.message]) {
      const known = knownErrors[error.message];

      return NextResponse.json(
        { message: known.message },
        { status: known.status }
      );
    }

    return NextResponse.json(
      { message: "Failed to create purchase." },
      { status: 500 }
    );
  }
}