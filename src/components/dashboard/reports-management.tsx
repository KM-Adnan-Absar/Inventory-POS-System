
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
      <div className="p-8 text-slate-500">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Reports & Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor your business performance.
        </p>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-white p-5 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
        </div>

        <button
          onClick={fetchReports}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          Apply Filter
        </button>

        <button
          onClick={() => {
            setStartDate("");
            setEndDate("");
          }}
          className="rounded-lg border px-5 py-2 hover:bg-slate-50"
        >
          Clear
        </button>
      </div>

      {/* Profit & Loss Cards */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          Profit & Loss Overview
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportCards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">
                {card.title}
              </p>

              <h3 className={`mt-2 text-2xl font-bold ${card.color}`}>
                {formatMoney(card.value)}
              </h3>
            </div>
          ))}
        </div>
      </div>

      {/* Business Summary */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          Business Summary
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700">
              Sales
            </h3>

            <p className="mt-3 text-sm text-slate-500">
              Total Sales
            </p>
            <p className="text-xl font-bold">
              {formatMoney(summary?.sales.total ?? 0)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Paid: {formatMoney(summary?.sales.paid ?? 0)}
            </p>

            <p className="text-sm text-slate-500">
              Transactions: {summary?.sales.count ?? 0}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700">
              Purchases
            </h3>

            <p className="mt-3 text-sm text-slate-500">
              Total Purchases
            </p>
            <p className="text-xl font-bold">
              {formatMoney(summary?.purchases.total ?? 0)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Paid: {formatMoney(summary?.purchases.paid ?? 0)}
            </p>

            <p className="text-sm text-slate-500">
              Due: {formatMoney(summary?.purchases.due ?? 0)}
            </p>

            <p className="text-sm text-slate-500">
              Transactions: {summary?.purchases.count ?? 0}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700">
              Expenses
            </h3>

            <p className="mt-3 text-sm text-slate-500">
              Total Expenses
            </p>
            <p className="text-xl font-bold text-red-600">
              {formatMoney(summary?.expenses.total ?? 0)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Transactions: {summary?.expenses.count ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800">
          Financial Status
        </h2>

        <p
          className={`mt-2 text-xl font-bold ${
            profitLoss?.status === "PROFIT"
              ? "text-green-600"
              : profitLoss?.status === "LOSS"
                ? "text-red-600"
                : "text-slate-600"
          }`}
        >
          {profitLoss?.status ?? "N/A"}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Based on selected date range.
        </p>
      </div>
    </div>
  );
}
