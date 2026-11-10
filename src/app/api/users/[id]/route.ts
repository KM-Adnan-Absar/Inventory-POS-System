
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";

const allowedRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "CASHIER",
  "STAFF",
];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if (!hasPermission(currentUser.role ?? "", "manageUsers")) {
      return NextResponse.json(
        { message: "You do not have permission." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { message: "Invalid role." },
        { status: 400 }
      );
    }

    // Prevent changing your own role accidentally
    if (currentUser.id === id) {
      return NextResponse.json(
        { message: "You cannot change your own role." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: "User role updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE USER ROLE ERROR:", error);

    return NextResponse.json(
      { message: "Failed to update user role." },
      { status: 500 }
    );
  }
}
