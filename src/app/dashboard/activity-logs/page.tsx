
import { requireRole } from "@/src/lib/require-auth";
import ActivityLogsManagement from "@/src/components/dashboard/activity-logs-management";

export default async function ActivityLogsPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <ActivityLogsManagement />
    </div>
  );
}
