
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  RefreshCw,
  Clock,
  UserRound,
  AlertCircle,
} from "lucide-react";

type ActivityLog = {
  id: number;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string | null;
  metadata: unknown;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string | null;
  };
};

export default function ActivityLogsManagement() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/activity-logs", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch activity logs.");
      }

      setActivities(
        Array.isArray(data.activities) ? data.activities : []
      );
    } catch (err) {
      console.error("FETCH ACTIVITY LOGS ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchActivities();
  }, [fetchActivities]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getActionColor = (action: string) => {
    const value = action.toUpperCase();

    if (value.includes("CREATE") || value.includes("STOCK_IN")) {
      return "bg-green-50 text-green-700";
    }

    if (value.includes("DELETE") || value.includes("STOCK_OUT")) {
      return "bg-red-50 text-red-700";
    }

    if (value.includes("UPDATE") || value.includes("ADJUSTMENT")) {
      return "bg-blue-50 text-blue-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="text-blue-600" size={25} />

            <h1 className="text-2xl font-bold text-slate-900">
              Activity Logs
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Monitor user activities and system operations.
          </p>
        </div>

        <button
          onClick={fetchActivities}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Summary Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <Activity size={25} />
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Total Activities
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {activities.length}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Latest 100 activity records
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* Activity Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">
            Recent Activities
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Latest actions performed by users.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw
              size={30}
              className="animate-spin text-blue-600"
            />

            <p className="mt-3 text-sm text-slate-500">
              Loading activities...
            </p>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-16 text-center">
            <Activity
              size={35}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-3 font-medium text-slate-700">
              No activities found
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              User activities will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-5 py-4 font-semibold">User</th>
                  <th className="px-5 py-4 font-semibold">Action</th>
                  <th className="px-5 py-4 font-semibold">Entity</th>
                  <th className="px-5 py-4 font-semibold">Description</th>
                  <th className="px-5 py-4 font-semibold">Date & Time</th>
                </tr>
              </thead>

              <tbody>
                {activities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50 last:border-0"
                  >
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <UserRound size={17} />
                        </div>

                        <div>
                          <p className="font-medium text-slate-800">
                            {activity.user?.name || "Unknown User"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {activity.user?.email || "No email"}
                          </p>

                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {activity.user?.role || "No role"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getActionColor(
                          activity.action
                        )}`}
                      >
                        {activity.action.replaceAll("_", " ")}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700">
                        {activity.entity}
                      </p>

                      {activity.entityId && (
                        <p className="mt-1 text-xs text-slate-400">
                          ID: {activity.entityId}
                        </p>
                      )}
                    </td>

                    {/* Description */}
                    <td className="max-w-xs px-5 py-4 text-slate-600">
                      {activity.description || "No description"}
                    </td>

                    {/* Date */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={15} className="text-slate-400" />

                        <span className="text-xs">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
