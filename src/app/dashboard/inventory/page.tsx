import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";
import InventoryManagement from "@/src/components/dashboard/inventory-management";

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading inventory...</div>}>
      <InventoryContent />
    </Suspense>
  );
}

async function InventoryContent() {
  await connection();

  const user = await requireUser();

  if (!hasPermission(user.role ?? "", "manageInventory")) {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <InventoryManagement />
    </main>
  );
}