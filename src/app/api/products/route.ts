
import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { requireProductPermission } from "@/src/lib/api-auth";
import { getCurrentUser } from "@/src/lib/require-auth";
import { createActivityLog } from "@/src/lib/create-activity-log";
import { productSchema } from "@/src/lib/validations/product";

export async function GET() {
  try {
    const access = await requireProductPermission();

    if (access.response) return access.response;

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.category.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    return NextResponse.json({
      products: products.map((product) => ({
        ...product,
        costPrice: product.costPrice.toString(),
        sellingPrice: product.sellingPrice.toString(),
      })),
      categories,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch products." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const product = await prisma.product.create({
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
      action: "CREATE",
      entity: "PRODUCT",
      entityId: String(product.id),
      description: `Created product: ${product.name}`,
      metadata: {
        productName: product.name,
        sku: product.sku,
        sellingPrice: product.sellingPrice.toString(),
      },
    });

    return NextResponse.json(
      {
        message: "Product created successfully.",
        product: {
          ...product,
          costPrice: product.costPrice.toString(),
          sellingPrice: product.sellingPrice.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    const code = (error as { code?: string }).code;

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
      { message: "Failed to create product." },
      { status: 500 }
    );
  }
}
