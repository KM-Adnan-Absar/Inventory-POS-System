import { Suspense } from "react";
import { connection } from "next/server";
import { requireUser } from "../../lib/require-auth";
import DashboardShell from "@/src/components/dashboard/dashboard-shell";
   
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await connection();

  const user = await requireUser();

  return (
    <DashboardShell
      name={user.name ?? "User"}
      email={user.email ?? ""}
      role={user.role ?? "user"}
    />
  );
}

function DashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl rounded-xl bg-white p-8 shadow">
        <p className="text-gray-500">
          Loading dashboard...
        </p>
      </div>
    </main>
  );
}