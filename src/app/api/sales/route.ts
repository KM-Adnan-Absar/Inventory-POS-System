import { NextResponse } from "next/server";
import { PaymentMethod, Prisma } from "@/src/generated/prisma/client";
import prisma from "@/src/lib/prisma";
import { requireSalePermission } from "@/src/lib/sales-auth";

const allowedPaymentMethods = Object.values(PaymentMethod);

export async function GET() {
  try {
    const access = await requireSalePermission();

    if (access.response) return access.response;

    const user = access.user!;

    const [products, sales] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          sku: true,
          sellingPrice: true,
          stock: true,
        },
        orderBy: {
          name: "asc",
        },
      }),

      prisma.sale.findMany({
        where:
          user.role === "CASHIER"
            ? { cashierId: user.id }
            : {},

        include: {
          cashier: {
            select: {
              name: true,
              email: true,
            },
          },
          items: {
            select: {
              id: true,
              productName: true,
              sku: true,
              quantity: true,
              unitPrice: true,
              lineTotal: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return NextResponse.json({
      products: products.map((product) => ({
        ...product,
        sellingPrice: product.sellingPrice.toString(),
      })),

      sales: sales.map((sale) => ({
        ...sale,
        subtotal: sale.subtotal.toString(),
        discount: sale.discount.toString(),
        total: sale.total.toString(),
        paidAmount: sale.paidAmount.toString(),
        changeAmount: sale.changeAmount.toString(),

        items: sale.items.map((item) => ({
          ...item,
          unitPrice: item.unitPrice.toString(),
          lineTotal: item.lineTotal.toString(),
        })),
      })),
    });
  } catch (error) {
    console.error("GET SALES ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch sales data." },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    // 1. Check permission
    const access = await requireSalePermission();

    if (access.response) {
      return access.response;
    }

    const user = access.user!;

    // 2. Read request body
    const body = await request.json();

    const { items, discount, paidAmount, paymentMethod } = body;

    // 3. Basic validation
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "Please add at least one product." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(discount ?? 0) ||
      (discount ?? 0) < 0
    ) {
      return NextResponse.json(
        { message: "Invalid discount amount." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      return NextResponse.json(
        { message: "Invalid paid amount." },
        { status: 400 }
      );
    }

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { message: "Invalid payment method." },
        { status: 400 }
      );
    }

    // 4. Validate product IDs and quantities
    for (const item of items) {
      if (
        !Number.isInteger(item.productId) ||
        item.productId <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return NextResponse.json(
          { message: "Invalid product or quantity." },
          { status: 400 }
        );
      }
    }

    // 5. Create sale using transaction
    const result = await prisma.$transaction(
      async (tx) => {
        let subtotal = new Prisma.Decimal(0);

        const saleItems = [];

        // 6. Get products from database
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: {
              id: item.productId,
            },
          });

          if (!product || !product.isActive) {
            throw new Error(
              `Product ID ${item.productId} is unavailable.`
            );
          }

          if (product.stock < item.quantity) {
            throw new Error(
              `Insufficient stock for ${product.name}. Available: ${product.stock}`
            );
          }

          const unitPrice = product.sellingPrice;

          const lineTotal = unitPrice.mul(item.quantity);

          subtotal = subtotal.add(lineTotal);

          saleItems.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: item.quantity,
            unitPrice,
            costPrice: product.costPrice,
            lineTotal,
          });

          // 7. Reduce stock safely
          const updated = await tx.product.updateMany({
            where: {
              id: product.id,
              stock: {
                gte: item.quantity,
              },
              isActive: true,
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          if (updated.count !== 1) {
            throw new Error(
              `Stock changed for ${product.name}. Please try again.`
            );
          }
        }

        // 8. Calculate total
        const discountAmount = new Prisma.Decimal(discount ?? 0);

        if (discountAmount.greaterThan(subtotal)) {
          throw new Error("Discount cannot exceed subtotal.");
        }

        const total = subtotal.sub(discountAmount);

        const paid = new Prisma.Decimal(paidAmount);

        if (paid.lessThan(total)) {
          throw new Error("Paid amount is less than total amount.");
        }

        const changeAmount = paid.sub(total);

        // 9. Generate invoice number
        const invoiceNumber = `SP-${crypto.randomUUID()}`;

        // 10. Create sale and sale items
        const sale = await tx.sale.create({
          data: {
            invoiceNumber,
            subtotal,
            discount: discountAmount,
            total,
            paidAmount: paid,
            changeAmount,
            paymentMethod,
            cashierId: user.id,

            items: {
              create: saleItems,
            },
          },
          include: {
            items: true,
          },
        });

        return sale;
      }
    );

    // 11. Return response
    return NextResponse.json(
      {
        message: "Sale completed successfully.",
        sale: {
          ...result,
          subtotal: result.subtotal.toString(),
          discount: result.discount.toString(),
          total: result.total.toString(),
          paidAmount: result.paidAmount.toString(),
          changeAmount: result.changeAmount.toString(),
          items: result.items.map((item) => ({
            ...item,
            unitPrice: item.unitPrice.toString(),
            costPrice: item.costPrice.toString(),
            lineTotal: item.lineTotal.toString(),
          })),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE SALE ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to complete sale.";

    return NextResponse.json(
      { message },
      { status: 400 }
    );
  }
}