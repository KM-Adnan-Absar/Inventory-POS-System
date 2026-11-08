import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";

export async function requireSalePermission() {
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

  if (!hasPermission(user.role ?? "", "createSale")) {
    return {
      user: null,
      response: NextResponse.json(
        { message: "You do not have permission to create sales." },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}