
import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";

function getDhakaDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getDhakaMidnight(dateKey: string) {
  // Bangladesh time is UTC+6.
  return new Date(`${dateKey}T00:00:00+06:00`);
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const todayKey = getDhakaDateKey(new Date());

    const [year, month, day] = todayKey.split("-").map(Number);

    // Last 7 calendar days, including today.
    const todayMidnight = getDhakaMidnight(todayKey);

    const startDate = new Date(todayMidnight);
    startDate.setUTCDate(startDate.getUTCDate() - 6);

    const endDate = new Date(todayMidnight);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    const salesWhere = {
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
      ...(user.role === "CASHIER"
        ? { cashierId: user.id }
        : {}),
    };

    const sales = await prisma.sale.findMany({
      where: salesWhere,
      select: {
        total: true,
        createdAt: true,
      },
    });

    // Initialize all 7 days with zero sales.
    const salesMap = new Map<string, number>();

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setUTCDate(date.getUTCDate() + i);

      const dateKey = getDhakaDateKey(date);
      salesMap.set(dateKey, 0);
    }

    // Add actual sales to their respective days.
    for (const sale of sales) {
      const dateKey = getDhakaDateKey(sale.createdAt);
      const previousTotal = salesMap.get(dateKey) ?? 0;

      salesMap.set(
        dateKey,
        previousTotal + Number(sale.total)
      );
    }

    const chartData = Array.from(salesMap.entries()).map(
      ([date, total]) => {
        // Parse date key for a consistent weekday label.
        const [y, m, d] = date.split("-").map(Number);
        const dateObject = new Date(Date.UTC(y, m - 1, d));

        const dayName = new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          timeZone: "UTC",
        }).format(dateObject);

        return {
          date,
          day: dayName,
          sales: total,
        };
      }
    );

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("DASHBOARD SALES CHART ERROR:", error);

    return NextResponse.json(
      { message: "Failed to load sales chart data." },
      { status: 500 }
    );
  }
}
