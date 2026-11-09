import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { requireUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";
import ReportsManagement from "@/src/components/dashboard/reports-management";

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading reports...</div>}>
      <ReportsContent />
    </Suspense>
  );
}

async function ReportsContent() {
  await connection();

  const user = await requireUser();

  if (!hasPermission(user.role ?? "", "viewReports")) {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <ReportsManagement />
    </main>
  );
}