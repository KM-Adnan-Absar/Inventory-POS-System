import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";

export async function GET(request: Request) {
  const requestHeaders = request.headers;

  try {
    // 1. Authentication
    const user = await getCurrentUser(requestHeaders);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    // 2. Permission
    if (!hasPermission(user.role ?? "", "manageInventory")) {
      return NextResponse.json(
        { message: "You do not have permission." },
        { status: 403 }
      );
    }

    // 3. Fetch inventory history
    const movements = await prisma.inventoryMovement.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 4. Response
    return NextResponse.json({
      total: movements.length,
      movements,
    });
  } catch (error) {
    console.error("INVENTORY HISTORY ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch inventory history." },
      { status: 500 }
    );
  }
}