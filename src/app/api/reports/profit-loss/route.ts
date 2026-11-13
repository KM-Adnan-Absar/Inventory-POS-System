
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

    const [sales, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  costPrice: true,
                },
              },
            },
          },
        },
      }),

      prisma.expense.aggregate({
        where: {
          expenseDate: {
            gte: start,
            lte: end,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const revenue = sales.reduce(
      (sum, sale) => sum + Number(sale.total),
      0
    );

    const cogs = sales.reduce((total, sale) => {
      const saleCost = sale.items.reduce(
        (sum, item) =>
          sum + Number(item.product.costPrice) * item.quantity,
        0
      );

      return total + saleCost;
    }, 0);

    const grossProfit = revenue - cogs;

    const operatingExpenses = Number(expenses._sum.amount ?? 0);

    const netProfit = grossProfit - operatingExpenses;

    return NextResponse.json({
      period: {
        startDate: start,
        endDate: end,
      },

      revenue,
      cogs,
      grossProfit,
      operatingExpenses,
      netProfit,

      salesCount: sales.length,

      status:
        netProfit > 0
          ? "PROFIT"
          : netProfit < 0
            ? "LOSS"
            : "BREAK_EVEN",
    });
  } catch (error) {
    console.error("PROFIT LOSS REPORT ERROR:", error);

    return NextResponse.json(
      { message: "Failed to generate profit and loss report." },
      { status: 500 }
    );
  }
}
