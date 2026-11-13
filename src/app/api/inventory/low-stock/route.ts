import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";

export async function GET(request: Request) {
  const requestHeaders = request.headers;

  try {
    // Check login
    const user = await getCurrentUser(requestHeaders);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    // Check permission
    if (!hasPermission(user.role ?? "", "manageInventory")) {
      return NextResponse.json(
        { message: "You do not have permission." },
        { status: 403 }
      );
    }

    // Get active products
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

    // Find low-stock products
    const lowStockProducts = products.filter(
      (product) => product.stock <= product.reorderLevel
    );

    return NextResponse.json({
      total: lowStockProducts.length,
      lowStockProducts,
    });
  } catch (error) {
    console.error("LOW STOCK ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch low stock products." },
      { status: 500 }
    );
  }
}