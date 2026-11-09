import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";

// GET: Get all expenses
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if (!hasPermission(user.role ?? "", "manageInventory")) {
      return NextResponse.json(
        { message: "You do not have permission." },
        { status: 403 }
      );
    }

    const expenses = await prisma.expense.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        expenseDate: "desc",
      },
    });

    return NextResponse.json({
      total: expenses.length,
      expenses,
    });
  } catch (error) {
    console.error("GET EXPENSES ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch expenses." },
      { status: 500 }
    );
  }
}

// POST: Create expense
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if (!hasPermission(user.role ?? "", "manageInventory")) {
      return NextResponse.json(
        { message: "You do not have permission." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      title,
      category,
      amount,
      description,
      paymentMethod,
      expenseDate,
    } = body;

    if (!title?.trim() || !category?.trim()) {
      return NextResponse.json(
        { message: "Title and category are required." },
        { status: 400 }
      );
    }

    const expenseAmount = Number(amount);

    if (!Number.isFinite(expenseAmount) || expenseAmount <= 0) {
      return NextResponse.json(
        { message: "Amount must be greater than 0." },
        { status: 400 }
      );
    }

    const validPaymentMethods = [
      "CASH",
      "CARD",
      "BKASH",
      "NAGAD",
      "ROCKET",
    ];

    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { message: "Invalid payment method." },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        title: title.trim(),
        category: category.trim(),
        amount: expenseAmount,
        description: description?.trim() || null,
        paymentMethod,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        createdById: user.id,
      },
    });

    return NextResponse.json(
      {
        message: "Expense created successfully.",
        expense,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE EXPENSE ERROR:", error);

    return NextResponse.json(
      { message: "Failed to create expense." },
      { status: 500 }
    );
  }
}