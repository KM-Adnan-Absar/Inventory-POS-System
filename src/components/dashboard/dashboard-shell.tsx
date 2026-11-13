
"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Bell,
  DollarSign,
  Wallet,
  History,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import LogoutButton from "../../components/logout-button";

type DashboardShellProps = {
  name: string;
  email: string;
  role: string;
  children: ReactNode;
};

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock: number;
  reorderLevel: number;
}

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

// Sidebar

function Sidebar({
  open,
  close,
  role,
}: {
  open: boolean;
  close: () => void;
  role: string;
}) {
  const pathname = usePathname();

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
          className="fixed inset-0 z-[64] bg-black/40"
        />
      )}

      <aside
        aria-label="Dashboard navigation"
        className={`fixed inset-y-0 left-0 z-[65] flex w-[min(280px,85vw)] flex-col bg-slate-950 text-white shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-800 px-5 sm:px-6">
          <div>
            <h1 className="text-2xl font-bold tracking-wide">
              Stock<span className="text-blue-400">Pilot</span>
            </h1>

            <p className="text-xs text-slate-400">
              Inventory Management
            </p>
          </div>

          <button
            onClick={close}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          {filteredNavigation.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={close}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon size={19} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-slate-800 p-4">
          <div className="rounded-lg bg-slate-900 p-3">
            <p className="text-sm font-medium">StockPilot v1.0</p>

            <p className="mt-1 text-xs text-slate-400">
              Inventory made simple
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

// Notification Dropdown

function NotificationDropdown({
  products,
  loading,
  error,
  refresh,
  onClose,
}: {
  products: LowStockProduct[];
  loading: boolean;
  error: string;
  refresh: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed right-3 top-[72px] z-[70] w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:absolute sm:right-0 sm:top-12 sm:w-[340px]">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
        <div>
          <h3 className="font-semibold text-slate-900">
            Notifications
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Stock alerts and updates
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh notifications"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
        </button>
      </div>

      <div className="max-h-[min(350px,55vh)] overflow-y-auto">
        {loading && products.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-400">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center">
            <AlertTriangle
              size={25}
              className="mx-auto mb-2 text-red-500"
            />

            <p className="text-sm text-red-500">{error}</p>

            <button
              onClick={refresh}
              className="mt-3 text-xs font-medium text-blue-600"
            >
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <CheckCircle2
              size={30}
              className="mx-auto mb-3 text-green-500"
            />

            <p className="text-sm font-medium text-slate-800">
              All caught up!
            </p>

            <p className="mt-1 text-xs text-slate-400">
              No low stock notifications.
            </p>
          </div>
        ) : (
          <div>
            <div className="border-b border-slate-100 bg-orange-50 px-4 py-2">
              <p className="text-xs font-semibold text-orange-700">
                {products.length} Low Stock Alert
                {products.length !== 1 ? "s" : ""}
              </p>
            </div>

            {products.map((product) => (
              <div
                key={product.id}
                className="flex gap-3 border-b border-slate-100 px-4 py-4 last:border-0"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                  <AlertTriangle size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {product.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    SKU: {product.sku}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                      Stock: {product.stock}
                    </span>

                    <span className="text-xs text-slate-400">
                      Reorder: {product.reorderLevel}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        <Link
          href="/dashboard/products"
          onClick={onClose}
          className="block rounded-lg bg-blue-50 px-3 py-2.5 text-center text-sm font-medium text-blue-600 transition hover:bg-blue-100"
        >
          Manage Products
        </Link>
      </div>
    </div>
  );
}

// Dashboard Shell

export default function DashboardShell({
  name,
  email,
  role,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const [lowStockProducts, setLowStockProducts] = useState<
    LowStockProduct[]
  >([]);

  const [notificationLoading, setNotificationLoading] = useState(true);
  const [notificationError, setNotificationError] = useState("");

  const toggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Lock body scroll and close sidebar with Escape

  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen]);

  // Close notification dropdown with Escape

  useEffect(() => {
    if (!notificationOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationOpen]);

  // Load low stock notifications

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      try {
        setNotificationError("");

        const response = await fetch("/api/dashboard/low-stock", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load notifications"
          );
        }

        if (!Array.isArray(data)) {
          throw new Error("Invalid notification response");
        }

        if (isMounted) {
          setLowStockProducts(data);
        }
      } catch (error) {
        console.error("NOTIFICATION ERROR:", error);

        if (isMounted) {
          setNotificationError("Failed to load notifications.");
        }
      } finally {
        if (isMounted) {
          setNotificationLoading(false);
        }
      }
    }

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Refresh notifications manually

  const refreshNotifications = async () => {
    try {
      setNotificationLoading(true);
      setNotificationError("");

      const response = await fetch("/api/dashboard/low-stock", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load notifications"
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid notification response");
      }

      setLowStockProducts(data);
    } catch (error) {
      console.error("NOTIFICATION REFRESH ERROR:", error);

      setNotificationError("Failed to refresh notifications.");
    } finally {
      setNotificationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        open={sidebarOpen}
        close={closeSidebar}
        role={role}
      />

      <header className="sticky top-0 z-[60] flex h-16 items-center justify-between border-b border-slate-200 bg-white px-3 sm:h-20 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={toggleSidebar}
            className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            aria-label={
              sidebarOpen ? "Close sidebar" : "Open sidebar"
            }
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={23} /> : <Menu size={23} />}
          </button>

          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              StockPilot
            </h2>

            <p className="hidden truncate text-xs text-slate-500 sm:block">
              Welcome back, {name}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3 lg:gap-5">
          {/* Notification Bell */}

          <div className="relative">
            <button
              onClick={() => {
                setNotificationOpen((previous) => !previous);
              }}
              aria-label="Notifications"
              aria-expanded={notificationOpen}
              className={`relative rounded-lg p-2 transition ${
                notificationOpen
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Bell size={20} />

              {lowStockProducts.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {lowStockProducts.length > 99
                    ? "99+"
                    : lowStockProducts.length}
                </span>
              )}
            </button>

            {notificationOpen && (
              <NotificationDropdown
                products={lowStockProducts}
                loading={notificationLoading}
                error={notificationError}
                refresh={refreshNotifications}
                onClose={() => setNotificationOpen(false)}
              />
            )}
          </div>

          <div className="hidden border-l border-slate-200 pl-3 sm:block lg:pl-4">
            <p className="max-w-36 truncate text-sm font-semibold text-slate-800">
              {name}
            </p>

            <p className="text-xs text-slate-500">{role}</p>
          </div>

          <div className="shrink-0">
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-64px)] p-3 sm:min-h-[calc(100vh-80px)] sm:p-6 lg:p-8">
        {children}

        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center">
          <p>© 2026 StockPilot. All rights reserved.</p>

          <p className="break-all sm:text-right">{email}</p>
        </footer>
      </main>
    </div>
  );
}
