
import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { requireProductPermission } from "@/src/lib/api-auth";

export async function GET() {
  try {
    const access = await requireProductPermission();
    if (access.response) return access.response;

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch categories." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireProductPermission();
    if (access.response) return access.response;

    const body = await request.json();

    const name = body.name?.trim();
    const description = body.description?.trim() || null;

    if (!name || name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { message: "Category name must be 2–50 characters." },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(
      {
        message: "Category created successfully.",
        category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);

    const code = (error as { code?: string }).code;

    if (code === "P2002") {
      return NextResponse.json(
        { message: "This category already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create category." },
      { status: 500 }
    );
  }
}
