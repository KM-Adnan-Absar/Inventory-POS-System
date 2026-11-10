
"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: string;
};

const roles = ["ADMIN", "MANAGER", "CASHIER", "STAFF"];

type UserManagementProps = {
  currentUserId: string;
};

export default function UserManagement({
  currentUserId,
}: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchUsers() {
    try {
      setLoading(true);

      const response = await fetch("/api/users");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load users.");
      }

      setUsers(data.users ?? []);
    } catch (error) {
      console.error("FETCH USERS ERROR:", error);
      alert(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  async function handleRoleChange(userId: string, role: string) {
    try {
      setUpdatingId(userId);

      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update role.");
      }

      alert("User role updated successfully.");

      await fetchUsers();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <p className="p-6">Loading users...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-sm text-gray-500">
          Manage users and their access roles.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Created Date</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;

              return (
                <tr key={user.id} className="border-t">
                  <td className="p-3 font-medium">{user.name}</td>

                  <td className="p-3">{user.email}</td>

                  <td className="p-3">
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium">
                      {user.role ?? "CASHIER"}
                    </span>
                  </td>

                  <td className="p-3">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-3">
                    {isCurrentUser ? (
                      <span className="text-xs text-gray-500">
                        Your account
                      </span>
                    ) : (
                      <select
                        value={user.role ?? "CASHIER"}
                        disabled={updatingId === user.id}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                        className="rounded-md border px-3 py-2"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    )}

                    {updatingId === user.id && (
                      <span className="ml-2 text-xs text-gray-500">
                        Updating...
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
