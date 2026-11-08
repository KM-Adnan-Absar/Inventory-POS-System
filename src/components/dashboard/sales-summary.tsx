"use client";

import { useEffect, useState } from "react";

type Sale = {
  id: number;
  total: string;
  createdAt: string;
};

export default function SalesSummary() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await fetch("/api/sales");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch sales");
        }

        setSales(data.sales ?? []);
      } catch (error) {
        console.error("Sales summary error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const today = new Date().toDateString();

  const todaySales = sales.filter(
    (sale) => new Date(sale.createdAt).toDateString() === today
  );

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + Number(sale.total),
    0
  );

  const todayRevenue = todaySales.reduce(
    (sum, sale) => sum + Number(sale.total),
    0
  );

  const summaryCards = [
    {
      title: "Total Sales",
      value: sales.length,
      icon: "🛒",
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Total Revenue",
      value: `৳${totalRevenue.toLocaleString()}`,
      icon: "💰",
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Today's Sales",
      value: todaySales.length,
      icon: "📊",
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Today's Revenue",
      value: `৳${todayRevenue.toLocaleString()}`,
      icon: "💵",
      color: "bg-orange-100 text-orange-600",
    },
  ];

  if (loading) {
    return <p className="py-5 text-slate-500">Loading sales summary...</p>;
  }

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-slate-800">
        Sales Overview
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{card.title}</p>

                <h3 className="mt-2 text-2xl font-bold text-slate-800">
                  {card.value}
                </h3>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${card.color}`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}