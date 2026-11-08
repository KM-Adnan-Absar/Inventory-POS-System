import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if (!hasPermission(user.role ?? "", "manageProducts")) {
      return NextResponse.json(
        { message: "You do not have permission." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supplierId = Number(id);

    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      return NextResponse.json(
        { message: "Invalid supplier ID." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const data: {
      name?: string;
      companyName?: string | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      notes?: string | null;
    } = {};

    if (body.name !== undefined) {
      const name = body.name.trim();

      if (!name || name.length > 100) {
        return NextResponse.json(
          { message: "Invalid supplier name." },
          { status: 400 }
        );
      }

      data.name = name;
    }

    if (body.companyName !== undefined) {
      data.companyName = body.companyName?.trim() || null;
    }

    if (body.phone !== undefined) {
      data.phone = body.phone?.trim() || null;
    }

    if (body.email !== undefined) {
      const email = body.email?.trim() || null;

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { message: "Invalid email address." },
          { status: 400 }
        );
      }

      data.email = email;
    }

    if (body.address !== undefined) {
      data.address = body.address?.trim() || null;
    }

    if (body.notes !== undefined) {
      data.notes = body.notes?.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No update data provided." },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data,
    });

    return NextResponse.json({
      message: "Supplier updated successfully.",
      supplier,
    });
  } catch (error) {
    console.error("UPDATE SUPPLIER ERROR:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Supplier not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update supplier." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if (!hasPermission(user.role ?? "", "manageProducts")) {
      return NextResponse.json(
        { message: "You do not have permission." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supplierId = Number(id);

    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      return NextResponse.json(
        { message: "Invalid supplier ID." },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      message: "Supplier deactivated successfully.",
      supplier,
    });
  } catch (error) {
    console.error("DELETE SUPPLIER ERROR:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Supplier not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Failed to deactivate supplier." },
      { status: 500 }
    );
  }
}