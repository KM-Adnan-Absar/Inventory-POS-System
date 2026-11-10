
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { action, entity, entityId, description, metadata } = body;

    if (!action || !entity) {
      return NextResponse.json(
        { message: "Action and entity are required." },
        { status: 400 }
      );
    }

    const activity = await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: String(action),
        entity: String(entity),
        entityId: entityId ? String(entityId) : null,
        description: description ? String(description) : null,
        metadata: metadata ?? undefined,
      },
    });

    return NextResponse.json(
      {
        message: "Activity logged successfully.",
        activity,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE ACTIVITY LOG ERROR:", error);

    return NextResponse.json(
      { message: "Failed to create activity log." },
      { status: 500 }
    );
  }
}

export async function GET() {
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

    const activities = await prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      total: activities.length,
      activities,
    });
  } catch (error) {
    console.error("GET ACTIVITY LOGS ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch activity logs." },
      { status: 500 }
    );
  }
}
