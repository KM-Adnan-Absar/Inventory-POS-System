import { NextRequest, NextResponse } from "next/server";
import { InventoryMovementType } from "@/src/generated/prisma/client";
import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";

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
    const newStock = Number(body.newStock);
    const note = body.note?.trim() || null;

    // 4. Validation
    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(newStock) ||
      newStock < 0
    ) {
      return NextResponse.json(
        { message: "Invalid product ID or stock quantity." },
        { status: 400 }
      );
    }

    // 5. Update stock + save history
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return null;
      }

      const previousStock = product.stock;
      const difference = Math.abs(newStock - previousStock);

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: newStock,
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          productId,
          type: InventoryMovementType.ADJUSTMENT,
          quantity: difference,
          previousStock,
          newStock,
          note,
          createdById: user.id,
        },
      });

      return {
        product: updatedProduct,
        movement,
      };
    });

    if (!result) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    // 6. Success response
    return NextResponse.json({
      message: "Stock adjusted successfully.",
      product: {
        id: result.product.id,
        name: result.product.name,
        stock: result.product.stock,
      },
      movement: result.movement,
    });
  } catch (error) {
    console.error("STOCK ADJUSTMENT ERROR:", error);

    return NextResponse.json(
      { message: "Failed to adjust stock." },
      { status: 500 }
    );
  }
}