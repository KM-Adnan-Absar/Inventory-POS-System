
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Boxes,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Types

interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockItems: number;
}

interface SalesChartItem {
  date: string;
  day: string;
  sales: number;
}

interface Transaction {
  id: number;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  itemCount: number;
  totalQuantity: number;
  products: string[];
  createdAt: string;
}

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock: number;
  reorderLevel: number;
}

// Summary Card

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-xs font-medium text-slate-500 sm:text-sm">
          {title}
        </p>

        <div className="shrink-0 rounded-lg bg-blue-50 p-2.5 text-blue-600 sm:p-3">
          <Icon size={20} />
        </div>
      </div>

      <h2 className="mt-3 break-words text-xl font-bold text-slate-900 sm:mt-4 sm:text-2xl">
        {value}
      </h2>

      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        {description}
      </p>
    </div>
  );
}

// Sales Overview

function SalesOverview() {
  const [salesData, setSalesData] = useState<SalesChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSalesChart() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/dashboard/sales-chart");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load sales chart"
          );
        }

        setSalesData(data);
      } catch (err) {
        console.error("SALES CHART ERROR:", err);
        setError("Failed to load sales chart data.");
      } finally {
        setLoading(false);
      }
    }

    loadSalesChart();
  }, []);

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900">
            Sales Overview
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Last 7 days sales performance
          </p>
        </div>

        <span className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-600 sm:px-3">
          Last 7 Days
        </span>
      </div>

      <div className="h-60 w-full min-w-0 sm:h-72">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Loading sales chart...
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-red-500">
            {error}
          </div>
        ) : salesData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No sales data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={salesData}
              margin={{
                top: 10,
                right: 5,
                left: -20,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id="salesGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#2563eb"
                    stopOpacity={0.25}
                  />

                  <stop
                    offset="95%"
                    stopColor="#2563eb"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickMargin={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748b" }}
                width={45}
              />

              <Tooltip
                formatter={(value) => [
                  `৳${Number(value).toLocaleString("en-BD")}`,
                  "Sales",
                ]}
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />

              <Area
                type="monotone"
                dataKey="sales"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="url(#salesGradient)"
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

// Recent Transactions

function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTransactions() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/dashboard/recent-transactions"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load transactions"
          );
        }

        setTransactions(data);
      } catch (err) {
        console.error("RECENT TRANSACTIONS ERROR:", err);
        setError("Failed to load recent transactions.");
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900">
            Recent Transactions
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Latest sales activity
          </p>
        </div>

        <Link
          href="/dashboard/sales"
          className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700 sm:text-sm"
        >
          View all →
        </Link>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th className="whitespace-nowrap pb-3 font-medium">
                Invoice
              </th>
              <th className="whitespace-nowrap pb-3 font-medium">
                Products
              </th>
              <th className="whitespace-nowrap pb-3 font-medium">
                Quantity
              </th>
              <th className="whitespace-nowrap pb-3 font-medium">
                Amount
              </th>
              <th className="whitespace-nowrap pb-3 font-medium">
                Payment
              </th>
              <th className="whitespace-nowrap pb-3 font-medium">
                Date
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-slate-400"
                >
                  Loading transactions...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-red-500"
                >
                  {error}
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-slate-400"
                >
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="whitespace-nowrap py-4 font-medium text-slate-700">
                    {item.invoiceNumber}
                  </td>

                  <td className="py-4 text-slate-600">
                    <div className="max-w-[180px]">
                      <p className="truncate">
                        {item.products.join(", ")}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {item.itemCount} product types
                      </p>
                    </div>
                  </td>

                  <td className="whitespace-nowrap py-4 text-slate-600">
                    {item.totalQuantity}
                  </td>

                  <td className="whitespace-nowrap py-4 font-medium text-slate-800">
                    ৳{item.amount.toLocaleString("en-BD")}
                  </td>

                  <td className="whitespace-nowrap py-4">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {item.paymentMethod}
                    </span>
                  </td>

                  <td className="whitespace-nowrap py-4 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString(
                      "en-BD",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        timeZone: "Asia/Dhaka",
                      }
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-slate-400 sm:hidden">
        Swipe horizontally to see all transaction details.
      </p>
    </section>
  );
}

// Low Stock Alerts

function LowStockAlerts() {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLowStockProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/dashboard/low-stock");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load low stock products"
          );
        }

        setProducts(data);
      } catch (err) {
        console.error("LOW STOCK FETCH ERROR:", err);
        setError("Failed to load low stock products.");
      } finally {
        setLoading(false);
      }
    }

    loadLowStockProducts();
  }, []);

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <AlertTriangle
            size={19}
            className="shrink-0 text-orange-500"
          />

          <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
            Low Stock Alerts
          </h2>
        </div>

        {!loading && !error && (
          <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
            {products.length} Items
          </span>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Loading low stock products...
          </p>
        ) : error ? (
          <p className="py-8 text-center text-sm text-red-500">
            {error}
          </p>
        ) : products.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
              <Boxes size={20} />
            </div>

            <p className="text-sm font-medium text-slate-700">
              All products are in good stock.
            </p>

            <p className="mt-1 text-xs text-slate-400">
              No low stock alerts right now.
            </p>
          </div>
        ) : (
          products.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium text-slate-800">
                  {item.name}
                </p>

                <p className="mt-1 break-all text-xs text-slate-400">
                  SKU: {item.sku}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Reorder level: {item.reorderLevel}
                </p>
              </div>

              <span className="shrink-0 rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 sm:px-3">
                {item.stock} left
              </span>
            </div>
          ))
        )}
      </div>

      <Link
        href="/dashboard/products"
        className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Manage inventory →
      </Link>
    </section>
  );
}

// Dashboard Overview

export default function DashboardOverview() {
  const [summary, setSummary] = useState<DashboardSummary>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockItems: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/dashboard/summary");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load dashboard summary"
          );
        }

        setSummary(data);
      } catch (err) {
        console.error("SUMMARY FETCH ERROR:", err);
        setError("Dashboard summary load failed.");
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, []);

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Overview
        </h1>

        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Here is what is happening with your store today.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <SummaryCard
          title="Total Revenue"
          value={
            loading
              ? "Loading..."
              : `৳ ${summary.totalRevenue.toLocaleString("en-BD")}`
          }
          description="Total sales revenue"
          icon={DollarSign}
        />

        <SummaryCard
          title="Total Orders"
          value={
            loading
              ? "Loading..."
              : summary.totalOrders.toLocaleString("en-BD")
          }
          description="Total sales"
          icon={Receipt}
        />

        <SummaryCard
          title="Total Products"
          value={
            loading
              ? "Loading..."
              : summary.totalProducts.toLocaleString("en-BD")
          }
          description="Active products"
          icon={Boxes}
        />

        <SummaryCard
          title="Low Stock Items"
          value={
            loading
              ? "Loading..."
              : summary.lowStockItems.toLocaleString("en-BD")
          }
          description="Products at or below reorder level"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-3 sm:gap-6">
        <div className="min-w-0 xl:col-span-2">
          <SalesOverview />
        </div>

        <div className="min-w-0">
          <LowStockAlerts />
        </div>
      </div>

      <RecentTransactions />
    </div>
  );
}
