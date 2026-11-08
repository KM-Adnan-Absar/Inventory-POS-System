
"use client";

import { useEffect, useState } from "react";

type Movement = {
  id: number;
  type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT";
  quantity: number;
  previousStock: number;
  newStock: number;
  note: string | null;
  createdAt: string;
  product: {
    id: number;
    name: string;
    sku: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
};

export default function InventoryHistory() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch("/api/inventory/history");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load history.");
        }

        setMovements(data.movements ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const getMovementLabel = (type: Movement["type"]) => {
    switch (type) {
      case "STOCK_IN":
        return "Stock In";
      case "STOCK_OUT":
        return "Stock Out";
      case "ADJUSTMENT":
        return "Adjustment";
      default:
        return type;
    }
  };

  const getMovementStyle = (type: Movement["type"]) => {
    switch (type) {
      case "STOCK_IN":
        return "bg-green-100 text-green-700";
      case "STOCK_OUT":
        return "bg-red-100 text-red-700";
      case "ADJUSTMENT":
        return "bg-blue-100 text-blue-700";
    }
  };

  if (loading) {
    return <p className="p-5 text-slate-500">Loading inventory history...</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="border-b p-5">
        <h2 className="text-lg font-semibold text-slate-800">
          Inventory Movement History
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Track all stock changes and activities.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Quantity</th>
              <th className="px-5 py-3">Previous Stock</th>
              <th className="px-5 py-3">New Stock</th>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Note</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {movements.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                  No inventory history found.
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4">
                    {new Date(movement.createdAt).toLocaleString()}
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800">
                      {movement.product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {movement.product.sku}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getMovementStyle(
                        movement.type
                      )}`}
                    >
                      {getMovementLabel(movement.type)}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-semibold">
                    {movement.type === "STOCK_IN" ? "+" : ""}
                    {movement.type === "STOCK_OUT" ? "-" : ""}
                    {movement.quantity}
                  </td>

                  <td className="px-5 py-4">{movement.previousStock}</td>

                  <td className="px-5 py-4 font-semibold">
                    {movement.newStock}
                  </td>

                  <td className="px-5 py-4">
                    {movement.createdBy.name}
                  </td>

                  <td className="max-w-48 px-5 py-4 text-slate-500">
                    {movement.note || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t px-5 py-3 text-sm text-slate-500">
        Total Records: {movements.length}
      </div>
    </div>
  );
}
