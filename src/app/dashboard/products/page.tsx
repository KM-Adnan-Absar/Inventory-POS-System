import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/require-auth";
import { hasPermission } from "@/src/lib/permissions";
import ProductManagement from "@/src/components/dashboard/product-management";


export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          Loading Product Management...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}

async function ProductsContent() {
  await connection();

  const user = await requireUser();

  if (!hasPermission(user.role as string, "manageProducts")) {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <ProductManagement />
    </main>
  );
}