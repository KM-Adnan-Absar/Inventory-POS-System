
import { NextResponse } from "next/server";
import { getCurrentUser } from "../lib/require-auth";
import { hasPermission } from "../lib/permissions";

export async function requireProductPermission() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { message: "Unauthorized. Please login." },
        { status: 401 }
      ),
    };
  }

  if (!hasPermission(user.role as string, "manageProducts")) {
    return {
      user: null,
      response: NextResponse.json(
        { message: "You do not have permission to manage products." },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}
