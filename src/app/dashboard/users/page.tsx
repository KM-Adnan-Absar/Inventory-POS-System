
import { requireRole } from "@/src/lib/require-auth";
import UserManagement from "@/src/components/dashboard/user-management";

export default async function UsersPage() {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);

  return (
    <div className="p-6">
      <UserManagement currentUserId={user.id} />
    </div>
  );
}
