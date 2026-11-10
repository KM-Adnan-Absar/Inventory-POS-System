
import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { requireProductPermission } from "@/src/lib/api-auth";
import { getCurrentUser } from "@/src/lib/require-auth";
import { createActivityLog } from "@/src/lib/create-activity-log";
import { productSchema } from "@/src/lib/validations/product";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const access = await requireProductPermission();

    if (access.response) return access.response;

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid product information.",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    const productId = Number(id);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { message: "Invalid product ID." },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || null,
        description: data.description || null,
        costPrice: data.costPrice.toFixed(2),
        sellingPrice: data.sellingPrice.toFixed(2),
        reorderLevel: data.reorderLevel,
        categoryId: Number(data.categoryId),
        isActive: data.isActive,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Save activity log
    await createActivityLog({
      userId: currentUser.id,
      action: "UPDATE",
      entity: "PRODUCT",
      entityId: String(product.id),
      description: `Updated product: ${product.name}`,
      metadata: {
        productName: product.name,
        sku: product.sku,
        sellingPrice: product.sellingPrice.toString(),
      },
    });

    return NextResponse.json({
      message: "Product updated successfully.",
      product: {
        ...product,
        costPrice: product.costPrice.toString(),
        sellingPrice: product.sellingPrice.toString(),
      },
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    const code = (error as { code?: string }).code;

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    if (code === "P2002") {
      return NextResponse.json(
        { message: "SKU or barcode already exists." },
        { status: 409 }
      );
    }

    if (code === "P2003") {
      return NextResponse.json(
        { message: "Selected category does not exist." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update product." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const access = await requireProductPermission();

    if (access.response) return access.response;

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { message: "Invalid product ID." },
        { status: 400 }
      );
    }

    // Fetch product before deleting it
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sku: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    // Save activity log
    await createActivityLog({
      userId: currentUser.id,
      action: "DELETE",
      entity: "PRODUCT",
      entityId: String(existingProduct.id),
      description: `Deleted product: ${existingProduct.name}`,
      metadata: {
        productName: existingProduct.name,
        sku: existingProduct.sku,
      },
    });

    return NextResponse.json({
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    const code = (error as { code?: string }).code;

    if (code === "P2025") {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Failed to delete product." },
      { status: 500 }
    );
  }
}
