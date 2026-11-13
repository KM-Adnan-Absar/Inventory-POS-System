import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "../lib/auth";

export async function getCurrentUser(requestHeaders?: Headers) {
  const currentHeaders = requestHeaders ?? (await headers());

  const session = await auth.api.getSession({
    headers: currentHeaders,
  });

  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: string[]) {
  const user = await requireUser();

  if (!roles.includes(user.role as string)) {
    redirect("/unauthorized");
  }

  return user;
}