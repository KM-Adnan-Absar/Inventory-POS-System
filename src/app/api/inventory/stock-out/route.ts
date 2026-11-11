import { NextRequest, NextResponse } from "next/server";
import { InventoryMovementType } from "@/src/generated/prisma/client";

import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";
import { createActivityLog } from "@/src/lib/create-activity-log";

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    // 2. Permission
    if (!hasPermission(user.role ?? "", "manageInventory")) {
      return NextResponse.json(
        { message: "You do not have permission." },
        { status: 403 }
      );
    }

    // 3. Request data
    const body = await request.json();

    const productId = Number(body.productId);
    const quantity = Number(body.quantity);
    const note = body.note?.trim() || null;

    // 4. Validation
    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return NextResponse.json(
        { message: "Invalid product ID or quantity." },
        { status: 400 }
      );
    }

    // 5. Stock update + movement history
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return { error: "NOT_FOUND" as const };
      }

      const previousStock = product.stock;

      // Prevent negative stock
      if (quantity > previousStock) {
        return { error: "INSUFFICIENT_STOCK" as const };
      }

      const newStock = previousStock - quantity;

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: quantity,
          },
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          productId,
          type: InventoryMovementType.STOCK_OUT,
          quantity,
          previousStock,
          newStock,
          note,
          createdById: user.id,
        },
      });

      return {
        product: updatedProduct,
        movement,
        previousStock,
        newStock,
      };
    });

    if ("error" in result) {
      if (result.error === "NOT_FOUND") {
        return NextResponse.json(
          { message: "Product not found." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { message: "Insufficient stock." },
        { status: 400 }
      );
    }

    // 6. Create Activity Log
    await createActivityLog({
      userId: user.id,
      action: "STOCK_OUT",
      entity: "INVENTORY",
      entityId: String(result.product.id),
      description: `Stock removed: ${result.product.name}`,
      metadata: {
        productId: result.product.id,
        productName: result.product.name,
        quantity,
        previousStock: result.previousStock,
        newStock: result.newStock,
        note: note ?? "",
      },
    });

    // 7. Response
    return NextResponse.json({
      message: "Stock removed successfully.",
      product: {
        id: result.product.id,
        name: result.product.name,
        stock: result.product.stock,
      },
      movement: result.movement,
    });
  } catch (error) {
    console.error("STOCK OUT ERROR:", error);

    return NextResponse.json(
      { message: "Failed to remove stock." },
      { status: 500 }
    );
  }
}