import { NextRequest, NextResponse } from "next/server";
import { InventoryMovementType } from "@/src/generated/prisma/client";
import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    // 2. Check inventory permission
    if (!hasPermission(user.role ?? "", "manageInventory")) {
      return NextResponse.json(
        { message: "You do not have permission." },
        { status: 403 }
      );
    }

    // 3. Get request data
    const body = await request.json();

    const productId = Number(body.productId);
    const quantity = Number(body.quantity);
    const note = body.note?.trim() || null;

    // 4. Validate input
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

    // 5. Update stock and save movement
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return null;
      }

      const previousStock = product.stock;
      const newStock = previousStock + quantity;

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            increment: quantity,
          },
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          productId,
          type: InventoryMovementType.STOCK_IN,
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
      message: "Stock added successfully.",
      product: {
        id: result.product.id,
        name: result.product.name,
        stock: result.product.stock,
      },
      movement: result.movement,
    });
  } catch (error) {
    console.error("STOCK IN ERROR:", error);

    return NextResponse.json(
      { message: "Failed to add stock." },
      { status: 500 }
    );
  }
}