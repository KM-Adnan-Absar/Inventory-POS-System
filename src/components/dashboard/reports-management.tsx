
"use client";

import { useEffect, useState } from "react";

type Summary = {
  sales: {
    total: number;
    paid: number;
    count: number;
  };
  purchases: {
    total: number;
    paid: number;
    due: number;
    count: number;
  };
  expenses: {
    total: number;
    count: number;
  };
};

type ProfitLoss = {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  salesCount: number;
  status: string;
};

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function ReportsManagement() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [profitLoss, setProfitLoss] = useState<ProfitLoss | null>(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const query = params.toString();
      const suffix = query ? `?${query}` : "";

      const [summaryRes, profitRes] = await Promise.all([
        fetch(`/api/reports/summary${suffix}`),
        fetch(`/api/reports/profit-loss${suffix}`),
      ]);

      const summaryData = await summaryRes.json();
      const profitData = await profitRes.json();

      if (!summaryRes.ok || !profitRes.ok) {
        throw new Error(
          summaryData.message ||
            profitData.message ||
            "Failed to load reports."
        );
      }

      setSummary(summaryData);
      setProfitLoss(profitData);
    } catch (error) {
      console.error("REPORT FETCH ERROR:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReports();
  }, []);

  const formatMoney = (amount: number) =>
    `৳${Number(amount || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const reportCards = [
    {
      title: "Total Revenue",
      value: profitLoss?.revenue ?? 0,
      color: "text-blue-600",
    },
    {
      title: "Cost of Goods Sold",
      value: profitLoss?.cogs ?? 0,
      color: "text-orange-600",
    },
    {
      title: "Gross Profit",
      value: profitLoss?.grossProfit ?? 0,
      color: "text-green-600",
    },
    {
      title: "Operating Expenses",
      value: profitLoss?.operatingExpenses ?? 0,
      color: "text-red-600",
    },
    {
      title: "Net Profit",
      value: profitLoss?.netProfit ?? 0,
      color:
        (profitLoss?.netProfit ?? 0) >= 0
          ? "text-green-600"
          : "text-red-600",
    },
  ];

  if (loading) {
    return (
      <div className="p-5 text-sm text-slate-500 sm:p-8">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
          Reports & Analytics
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Monitor your business performance.
        </p>
      </div>

      {/* Date Filter */}
      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-800">
          Filter Reports
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto_auto] xl:items-end">
          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <button
            type="button"
            onClick={fetchReports}
            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-full xl:w-auto"
          >
            Apply Filter
          </button>

          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="w-full rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-full xl:w-auto"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Profit & Loss Cards */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-800 sm:text-lg">
          Profit & Loss Overview
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {reportCards.map((card) => (
            <div
              key={card.title}
              className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-5"
            >
              <p className="text-xs text-slate-500 sm:text-sm">
                {card.title}
              </p>

              <h3
                className={`mt-2 break-words text-xl font-bold sm:text-2xl ${card.color}`}
              >
                {formatMoney(card.value)}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* Business Summary */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-800 sm:text-lg">
          Business Summary
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {/* Sales */}
          <div className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
            <h3 className="font-semibold text-slate-700">
              Sales
            </h3>

            <p className="mt-3 text-xs text-slate-500 sm:text-sm">
              Total Sales
            </p>
            <p className="break-words text-lg font-bold sm:text-xl">
              {formatMoney(summary?.sales.total ?? 0)}
            </p>

            <p className="mt-2 break-words text-xs text-slate-500 sm:text-sm">
              Paid: {formatMoney(summary?.sales.paid ?? 0)}
            </p>

            <p className="text-xs text-slate-500 sm:text-sm">
              Transactions: {summary?.sales.count ?? 0}
            </p>
          </div>

          {/* Purchases */}
          <div className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
            <h3 className="font-semibold text-slate-700">
              Purchases
            </h3>

            <p className="mt-3 text-xs text-slate-500 sm:text-sm">
              Total Purchases
            </p>
            <p className="break-words text-lg font-bold sm:text-xl">
              {formatMoney(summary?.purchases.total ?? 0)}
            </p>

            <p className="mt-2 break-words text-xs text-slate-500 sm:text-sm">
              Paid: {formatMoney(summary?.purchases.paid ?? 0)}
            </p>

            <p className="break-words text-xs text-slate-500 sm:text-sm">
              Due: {formatMoney(summary?.purchases.due ?? 0)}
            </p>

            <p className="text-xs text-slate-500 sm:text-sm">
              Transactions: {summary?.purchases.count ?? 0}
            </p>
          </div>

          {/* Expenses */}
          <div className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
            <h3 className="font-semibold text-slate-700">
              Expenses
            </h3>

            <p className="mt-3 text-xs text-slate-500 sm:text-sm">
              Total Expenses
            </p>
            <p className="break-words text-lg font-bold text-red-600 sm:text-xl">
              {formatMoney(summary?.expenses.total ?? 0)}
            </p>

            <p className="mt-2 text-xs text-slate-500 sm:text-sm">
              Transactions: {summary?.expenses.count ?? 0}
            </p>
          </div>
        </div>
      </section>

      {/* Financial Status */}
      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
          Financial Status
        </h2>

        <p
          className={`mt-2 break-words text-xl font-bold sm:text-2xl ${
            profitLoss?.status === "PROFIT"
              ? "text-green-600"
              : profitLoss?.status === "LOSS"
                ? "text-red-600"
                : "text-slate-600"
          }`}
        >
          {profitLoss?.status ?? "N/A"}
        </p>

        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Based on selected date range.
        </p>
      </div>
    </div>
  );
}
