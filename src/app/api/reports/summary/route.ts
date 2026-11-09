import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";

export async function GET() {
  try {
    const user = await getCurrentUser();

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

    const [sales, purchases, expenses] = await Promise.all([
      prisma.sale.aggregate({
        _sum: {
          total: true,
          paidAmount: true,
        },
        _count: {
          id: true,
        },
      }),

      prisma.purchase.aggregate({
        _sum: {
          total: true,
          paidAmount: true,
          dueAmount: true,
        },
        _count: {
          id: true,
        },
      }),

      prisma.expense.aggregate({
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    return NextResponse.json({
      sales: {
        total: Number(sales._sum.total ?? 0),
        paid: Number(sales._sum.paidAmount ?? 0),
        count: sales._count.id,
      },

      purchases: {
        total: Number(purchases._sum.total ?? 0),
        paid: Number(purchases._sum.paidAmount ?? 0),
        due: Number(purchases._sum.dueAmount ?? 0),
        count: purchases._count.id,
      },

      expenses: {
        total: Number(expenses._sum.amount ?? 0),
        count: expenses._count.id,
      },
    });
  } catch (error) {
    console.error("REPORT SUMMARY ERROR:", error);

    return NextResponse.json(
      { message: "Failed to generate report summary." },
      { status: 500 }
    );
  }
}