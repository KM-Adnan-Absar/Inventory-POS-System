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

    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        expenseDate: "desc",
      },
    });

    const totalExpense = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    const categorySummary = Object.values(
      expenses.reduce(
        (summary, expense) => {
          const category = expense.category;

          if (!summary[category]) {
            summary[category] = {
              category,
              total: 0,
              count: 0,
            };
          }

          summary[category].total += Number(expense.amount);
          summary[category].count += 1;

          return summary;
        },
        {} as Record<
          string,
          { category: string; total: number; count: number }
        >
      )
    );

    return NextResponse.json({
      count: expenses.length,
      totalExpense,
      categorySummary,
      expenses,
    });
  } catch (error) {
    console.error("EXPENSE REPORT ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch expense report." },
      { status: 500 }
    );
  }
}