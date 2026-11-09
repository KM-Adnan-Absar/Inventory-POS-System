import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { requireUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";
import PurchaseManagement from "@/src/components/dashboard/purchase-management";

export default function PurchasesPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading purchases...</div>}>
      <PurchasesContent />
    </Suspense>
  );
}

async function PurchasesContent() {
  await connection();

  const user = await requireUser();

  if (!hasPermission(user.role ?? "", "manageInventory")) {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <PurchaseManagement />
    </main>
  );
}