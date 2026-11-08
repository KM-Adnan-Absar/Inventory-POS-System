
import { NextRequest, NextResponse } from "next/server";
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

    if (!hasPermission(user.role ?? "", "manageProducts")) {
      return NextResponse.json(
        { message: "You do not have permission." },
        { status: 403 }
      );
    }

    const suppliers = await prisma.supplier.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      total: suppliers.length,
      suppliers,
    });
  } catch (error) {
    console.error("GET SUPPLIERS ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch suppliers." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const name = body.name?.trim();
    const companyName = body.companyName?.trim() || null;
    const phone = body.phone?.trim() || null;
    const email = body.email?.trim() || null;
    const address = body.address?.trim() || null;
    const notes = body.notes?.trim() || null;

    if (!name) {
      return NextResponse.json(
        { message: "Supplier name is required." },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { message: "Supplier name is too long." },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Invalid email address." },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        companyName,
        phone,
        email,
        address,
        notes,
      },
    });

    return NextResponse.json(
      {
        message: "Supplier created successfully.",
        supplier,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE SUPPLIER ERROR:", error);

    return NextResponse.json(
      { message: "Failed to create supplier." },
      { status: 500 }
    );
  }
}
