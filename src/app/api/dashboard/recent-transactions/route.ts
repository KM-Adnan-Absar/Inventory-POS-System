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

    const sales = await prisma.sale.findMany({
      where:
        user.role === "CASHIER"
          ? { cashierId: user.id }
          : {},
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
          },
        },
      },
    });

    const transactions = sales.map((sale) => ({
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      amount: Number(sale.total),
      paymentMethod: sale.paymentMethod,
      itemCount: sale.items.length,
      totalQuantity: sale.items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
      products: sale.items.map((item) => item.productName),
      createdAt: sale.createdAt,
    }));

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("RECENT TRANSACTIONS ERROR:", error);

    return NextResponse.json(
      { message: "Failed to load recent transactions." },
      { status: 500 }
    );
  }
}