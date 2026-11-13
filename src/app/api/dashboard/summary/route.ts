
import { NextResponse } from "next/server";

import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";

export async function GET(request: Request) {
  const requestHeaders = request.headers;

  try {
    const user = await getCurrentUser(requestHeaders);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    // Cashier can only see their own sales.
    const salesWhere =
      user.role === "CASHIER"
        ? { cashierId: user.id }
        : {};

    const [
      salesSummary,
      totalProducts,
      products,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: salesWhere,
        _sum: {
          total: true,
        },
        _count: {
          _all: true,
        },
      }),

      prisma.product.count({
        where: {
          isActive: true,
        },
      }),

      prisma.product.findMany({
        where: {
          isActive: true,
        },
        select: {
          stock: true,
          reorderLevel: true,
        },
      }),
    ]);

    // Low stock means stock <= reorderLevel.
    const lowStockItems = products.filter(
      (product) => product.stock <= product.reorderLevel
    ).length;

    return NextResponse.json({
      totalRevenue: Number(salesSummary._sum.total ?? 0),
      totalOrders: salesSummary._count._all,
      totalProducts,
      lowStockItems,
    });
  } catch (error) {
    console.error("DASHBOARD SUMMARY ERROR:", error);

    return NextResponse.json(
      { message: "Failed to load dashboard summary." },
      { status: 500 }
    );
  }
}
