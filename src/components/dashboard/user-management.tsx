
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

const selectClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50";

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

      setUsers(Array.isArray(data.users) ? data.users : []);
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
    return (
      <p className="p-5 text-sm text-slate-500 sm:p-6">
        Loading users...
      </p>
    );
  }

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
          User Management
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Manage users and their access roles.
        </p>
      </div>

      {/* User Count */}
      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <p className="text-xs text-slate-500 sm:text-sm">
          Total Registered Users
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl">
          {users.length}
        </h2>
      </div>

      {/* User Table */}
      <div className="min-w-0 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4 sm:p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
              Registered Users
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              View users and manage their roles.
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {users.length} Users
          </span>
        </div>

        {users.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">
            No users found.
          </p>
        ) : (
          <>
            {/* Mobile Scroll Hint */}
            <p className="px-4 pt-3 text-xs text-slate-400 sm:hidden">
              Swipe horizontally to view all columns →
            </p>

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="whitespace-nowrap p-3 sm:p-4">
                      Name
                    </th>
                    <th className="whitespace-nowrap p-3 sm:p-4">
                      Email
                    </th>
                    <th className="whitespace-nowrap p-3 sm:p-4">
                      Current Role
                    </th>
                    <th className="whitespace-nowrap p-3 sm:p-4">
                      Created Date
                    </th>
                    <th className="whitespace-nowrap p-3 sm:p-4">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => {
                    const isCurrentUser = user.id === currentUserId;

                    return (
                      <tr
                        key={user.id}
                        className="border-t transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap p-3 font-medium text-slate-800 sm:p-4">
                          {user.name}
                          {isCurrentUser && (
                            <span className="ml-2 rounded bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700">
                              You
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap p-3 text-slate-600 sm:p-4">
                          {user.email}
                        </td>

                        <td className="whitespace-nowrap p-3 sm:p-4">
                          <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {user.role ?? "CASHIER"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap p-3 text-slate-600 sm:p-4">
                          {new Date(user.createdAt).toLocaleDateString(
                            "en-GB"
                          )}
                        </td>

                        <td className="p-3 sm:p-4">
                          {isCurrentUser ? (
                            <span className="text-xs font-medium text-slate-500">
                              Your account
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <select
                                value={user.role ?? "CASHIER"}
                                disabled={updatingId === user.id}
                                onChange={(e) =>
                                  handleRoleChange(user.id, e.target.value)
                                }
                                className={selectClass}
                              >
                                {roles.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>

                              {updatingId === user.id && (
                                <span className="whitespace-nowrap text-xs text-blue-600">
                                  Updating...
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
