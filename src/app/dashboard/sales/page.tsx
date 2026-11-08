import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { requireUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";
import SalesManagement from "@/src/components/dashboard/sales-management";
import SalesHistory from "@/src/components/dashboard/sales-hostory";
import SalesSummary from "@/src/components/dashboard/sales-summary";
export default function SalesPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading sales...</div>}>
      <SalesContent />
    </Suspense>
  );
}

async function SalesContent() {
  await connection();

  const user = await requireUser();

  if (!hasPermission(user.role ?? "", "createSale")) {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
   <SalesSummary />
  <SalesManagement />
  <SalesHistory />
</main>
  );
}