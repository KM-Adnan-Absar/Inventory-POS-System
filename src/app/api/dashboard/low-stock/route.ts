
import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        reorderLevel: true,
      },
      orderBy: {
        stock: "asc",
      },
    });

    const lowStockProducts = products
      .filter((product) => product.stock <= product.reorderLevel)
      .map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        reorderLevel: product.reorderLevel,
      }));

    return NextResponse.json(lowStockProducts);
  } catch (error) {
    console.error("LOW STOCK ALERT ERROR:", error);

    return NextResponse.json(
      { message: "Failed to load low stock products." },
      { status: 500 }
    );
  }
}
