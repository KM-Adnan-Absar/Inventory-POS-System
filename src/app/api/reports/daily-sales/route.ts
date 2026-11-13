import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";

export async function GET(request: NextRequest) {
  const requestHeaders = request.headers;

  try {
    const user = await getCurrentUser(requestHeaders);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if (!hasPermission(user.role ?? "", "viewReports")) {
      return NextResponse.json(
        { message: "You do not have permission." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const start = startDate
      ? new Date(`${startDate}T00:00:00`)
      : new Date(new Date().setHours(0, 0, 0, 0));

    const end = endDate
      ? new Date(`${endDate}T23:59:59.999`)
      : new Date(new Date().setHours(23, 59, 59, 999));

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start > end
    ) {
      return NextResponse.json(
        { message: "Invalid date range." },
        { status: 400 }
      );
    }

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        cashier: {
          select: {
            name: true,
          },
        },
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalSales = sales.reduce(
      (sum, sale) => sum + Number(sale.total),
      0
    );

    const totalPaid = sales.reduce(
      (sum, sale) => sum + Number(sale.paidAmount),
      0
    );

    return NextResponse.json({
      total: sales.length,
      totalSales,
      totalPaid,
      sales,
    });
  } catch (error) {
    console.error("DAILY SALES REPORT ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch daily sales report." },
      { status: 500 }
    );
  }
}