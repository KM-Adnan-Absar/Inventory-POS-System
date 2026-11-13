
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
    <div className="min-w-0 space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Activity
              className="shrink-0 text-blue-600"
              size={23}
            />

            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Activity Logs
            </h1>
          </div>

          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            Monitor user activities and system operations.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchActivities}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Summary Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="shrink-0 rounded-lg bg-blue-50 p-2.5 text-blue-600 sm:p-3">
            <Activity size={23} />
          </div>

          <div className="min-w-0">
            <p className="text-xs text-slate-500 sm:text-sm">
              Total Activities
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
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
        <div className="flex min-w-0 items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <p className="break-words">{error}</p>
        </div>
      )}

      {/* Activity History */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Recent Activities
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Latest actions performed by users.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16">
            <RefreshCw
              size={28}
              className="animate-spin text-blue-600"
            />

            <p className="mt-3 text-sm text-slate-500">
              Loading activities...
            </p>
          </div>
        ) : activities.length === 0 ? (
          <div className="px-4 py-12 text-center sm:py-16">
            <Activity
              size={32}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-3 font-medium text-slate-700">
              No activities found
            </h3>

            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              User activities will appear here.
            </p>
          </div>
        ) : (
          <>
            <p className="px-4 pt-3 text-xs text-slate-400 sm:hidden">
              Swipe horizontally to view all columns →
            </p>

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="whitespace-nowrap px-4 py-4 font-semibold sm:px-5">
                      User
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold sm:px-5">
                      Action
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold sm:px-5">
                      Entity
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold sm:px-5">
                      Description
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold sm:px-5">
                      Date & Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {activities.map((activity) => (
                    <tr
                      key={activity.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50 last:border-0"
                    >
                      {/* User */}
                      <td className="px-4 py-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <UserRound size={17} />
                          </div>

                          <div className="min-w-0">
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
                      <td className="px-4 py-4 sm:px-5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${getActionColor(
                            activity.action
                          )}`}
                        >
                          {activity.action.replaceAll("_", " ")}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="px-4 py-4 sm:px-5">
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
                      <td className="max-w-xs px-4 py-4 text-slate-600 sm:px-5">
                        <p className="break-words">
                          {activity.description || "No description"}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock
                            size={15}
                            className="shrink-0 text-slate-400"
                          />

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
          </>
        )}
      </div>
    </div>
  );
}
