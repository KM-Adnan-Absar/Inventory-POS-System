
import prisma from "@/src/lib/prisma";
import { Prisma } from "../generated/prisma/browser";

type ActivityLogInput = {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function createActivityLog({
  userId,
  action,
  entity,
  entityId,
  description,
  metadata,
}: ActivityLogInput) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        description,
        metadata,
      },
    });
  } catch (error) {
    console.error("ACTIVITY LOG ERROR:", error);
  }
}
