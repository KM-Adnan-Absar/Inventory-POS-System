import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";

export async function GET(request: NextRequest) {
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

    const purchases = await prisma.purchase.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        supplier: {
          select: {
            name: true,
            companyName: true,
          },
        },
        createdBy: {
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

    const totalPurchase = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.total),
      0
    );

    const totalPaid = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.paidAmount),
      0
    );

    const totalDue = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.dueAmount),
      0
    );

    return NextResponse.json({
      count: purchases.length,
      totalPurchase,
      totalPaid,
      totalDue,
      purchases,
    });
  } catch (error) {
    console.error("PURCHASE REPORT ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch purchase report." },
      { status: 500 }
    );
  }
}