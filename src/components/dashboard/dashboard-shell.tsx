
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Boxes,
  AlertTriangle,
  Receipt,
  Wallet,
  History,
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
import LogoutButton from "../../components/logout-button";

type DashboardShellProps = {
  name: string;
  email: string;
  role: string;
};

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "User Management", href: "/dashboard/users", icon: Users },
  { label: "Activity Logs", href: "/dashboard/activity-logs", icon: History },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Sales", href: "/dashboard/sales", icon: ShoppingCart },
  { label: "Inventory", href: "/dashboard/inventory", icon: Package },
  { label: "Purchases", href: "/dashboard/purchases", icon: Wallet },
  { label: "Expenses", href: "/dashboard/expenses", icon: DollarSign },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Suppliers", href: "/dashboard/suppliers", icon: Truck },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const salesData = [
  { day: "Mon", sales: 1200 },
  { day: "Tue", sales: 2100 },
  { day: "Wed", sales: 1800 },
  { day: "Thu", sales: 2800 },
  { day: "Fri", sales: 2400 },
  { day: "Sat", sales: 3500 },
  { day: "Sun", sales: 3100 },
];

const transactions = [
  { id: "SP-1001", customer: "Rahim Ahmed", amount: 4500, status: "Completed" },
  { id: "SP-1002", customer: "Karim Hasan", amount: 2800, status: "Pending" },
  { id: "SP-1003", customer: "Nusrat Jahan", amount: 6200, status: "Completed" },
  { id: "SP-1004", customer: "Sabbir Hossain", amount: 1500, status: "Completed" },
];

const lowStockItems = [
  { name: "Wireless Mouse", sku: "PRD-001", stock: 3 },
  { name: "Keyboard", sku: "PRD-002", stock: 2 },
  { name: "USB Cable", sku: "PRD-003", stock: 4 },
];

function Sidebar({
  open,
  close,
  role,
}: {
  open: boolean;
  close: () => void;
  role: string;
}) {
  const filteredNavigation = navigation.filter((item) => {
    if (
      item.label === "User Management" ||
      item.label === "Activity Logs"
    ) {
      return ["SUPER_ADMIN", "ADMIN"].includes(role);
    }

    return true;
  });

  return (
    <>
      {open && (
        <button
          aria-label="Close sidebar overlay"
          onClick={close}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-white transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <div>
            <h1 className="text-2xl font-bold tracking-wide">
              Stock<span className="text-blue-400">Pilot</span>
            </h1>
            <p className="text-xs text-slate-400">Inventory Management</p>
          </div>

          <button onClick={close} className="lg:hidden" aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          {filteredNavigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={close}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                item.label === "Dashboard"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon size={19} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="rounded-lg bg-slate-900 p-3">
            <p className="text-sm font-medium">StockPilot v1.0</p>
            <p className="mt-1 text-xs text-slate-400">Inventory made simple</p>
          </div>
        </div>
      </aside>
    </>
  );
}

function SummaryCard({
  title,
  value,
  change,
  icon: Icon,
  positive = true,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
          <Icon size={21} />
        </div>
      </div>

      <h2 className="mt-4 text-2xl font-bold text-slate-900">{value}</h2>

      <div className="mt-2 flex items-center gap-1 text-xs">
        {positive ? (
          <TrendingUp size={15} className="text-green-600" />
        ) : (
          <TrendingDown size={15} className="text-red-600" />
        )}
        <span className={positive ? "text-green-600" : "text-red-600"}>
          {change}
        </span>
        <span className="text-slate-400">from last month</span>
      </div>
    </div>
  );
}

function SalesOverview() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Sales Overview</h2>
          <p className="mt-1 text-xs text-slate-500">Weekly sales performance</p>
        </div>
        <span className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
          This Week
        </span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesData}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#2563eb"
              strokeWidth={3}
              fill="url(#salesGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function RecentTransactions() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
          <p className="mt-1 text-xs text-slate-500">Latest sales activity</p>
        </div>
        <Link href="/dashboard/sales" className="text-sm font-medium text-blue-600">
          View all
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-slate-500">
              <th className="pb-3 font-medium">Invoice</th>
              <th className="pb-3 font-medium">Customer</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-4 font-medium text-slate-700">{item.id}</td>
                <td className="py-4 text-slate-600">{item.customer}</td>
                <td className="py-4 font-medium text-slate-800">
                  ৳{item.amount.toLocaleString("en-BD")}
                </td>
                <td className="py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      item.status === "Completed"
                        ? "bg-green-50 text-green-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LowStockAlerts() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <AlertTriangle size={19} className="text-orange-500" />
        <h2 className="font-semibold text-slate-900">Low Stock Alerts</h2>
      </div>

      <div className="space-y-4">
        {lowStockItems.map((item) => (
          <div
            key={item.sku}
            className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-slate-800">{item.name}</p>
              <p className="mt-1 text-xs text-slate-400">{item.sku}</p>
            </div>
            <span className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
              {item.stock} left
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/dashboard/products"
        className="mt-4 block text-sm font-medium text-blue-600"
      >
        Manage inventory →
      </Link>
    </section>
  );
}

export default function DashboardShell({
  name,
  email,
  role,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        open={sidebarOpen}
        close={() => setSidebarOpen(false)}
        role={role}
      />

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={23} />
            </button>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Welcome back, {name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button aria-label="Search" className="text-slate-500">
              <Search size={20} />
            </button>
            <button aria-label="Notifications" className="relative text-slate-500">
              <Bell size={20} />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="hidden border-l border-slate-200 pl-4 sm:block">
              <p className="text-sm font-semibold text-slate-800">{name}</p>
              <p className="text-xs text-slate-500">{role}</p>
            </div>

            <LogoutButton />
          </div>
        </header>

        <main className="space-y-6 p-4 sm:p-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Overview
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Here is what is happening with your store today.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Total Revenue"
              value="৳ 2,45,000"
              change="+12.5%"
              icon={DollarSign}
            />
            <SummaryCard
              title="Total Orders"
              value="1,250"
              change="+8.2%"
              icon={Receipt}
            />
            <SummaryCard
              title="Total Products"
              value="485"
              change="+4.3%"
              icon={Boxes}
            />
            <SummaryCard
              title="Low Stock Items"
              value="12"
              change="-2.1%"
              icon={AlertTriangle}
              positive={false}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <SalesOverview />
            </div>
            <LowStockAlerts />
          </div>

          <RecentTransactions />

          <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row">
            <p>© 2026 StockPilot. All rights reserved.</p>
            <p>{email}</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
