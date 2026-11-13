
"use client";

import { useEffect, useState, type FormEvent } from "react";
import InventoryHistory from "./inventory-history";

type Product = {
  id: number;
  name: string;
  sku: string;
  stock: number;
  reorderLevel: number;
  category?: { name: string } | null;
};

type ActionType = "stock-in" | "stock-out" | "adjustment";

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function InventoryManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [actionType, setActionType] = useState<ActionType>("stock-in");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [newStock, setNewStock] = useState("");
  const [note, setNote] = useState("");

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const [productsRes, lowStockRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/inventory/low-stock"),
      ]);

      const productsData = await productsRes.json();
      const lowStockData = await lowStockRes.json();

      if (!productsRes.ok) {
        throw new Error(productsData.message || "Failed to load products.");
      }

      if (!lowStockRes.ok) {
        throw new Error(
          lowStockData.message || "Failed to load low stock products."
        );
      }

      setProducts(
        Array.isArray(productsData.products) ? productsData.products : []
      );
      setLowStockCount(lowStockData.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInventory();
  }, []);

  const selectedProduct = products.find(
    (product) => product.id === Number(productId)
  );

  const handleStockAction = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!productId) {
      setError("Please select a product.");
      return;
    }

    const value =
      actionType === "adjustment" ? Number(newStock) : Number(quantity);

    if (
      !Number.isInteger(value) ||
      (actionType === "adjustment" ? value < 0 : value <= 0)
    ) {
      setError(
        actionType === "adjustment"
          ? "New stock must be a non-negative integer."
          : "Quantity must be a positive integer."
      );
      return;
    }

    try {
      setSaving(true);

      const endpoint = `/api/inventory/${actionType}`;

      const body =
        actionType === "adjustment"
          ? { productId, newStock: value, note }
          : { productId, quantity: value, note };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Stock operation failed.");
      }

      setSuccess(data.message || "Stock updated successfully.");
      setQuantity("");
      setNewStock("");
      setNote("");

      await loadInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const totalProducts = products.length;

  const totalStockUnits = products.reduce(
    (total, product) => total + product.stock,
    0
  );

  const outOfStock = products.filter(
    (product) => product.stock === 0
  ).length;

  const summaryCards = [
    {
      title: "Total Products",
      value: totalProducts,
      color: "text-slate-800",
    },
    {
      title: "Total Stock Units",
      value: totalStockUnits,
      color: "text-blue-600",
    },
    {
      title: "Low Stock Products",
      value: lowStockCount,
      color: "text-orange-600",
    },
    {
      title: "Out of Stock",
      value: outOfStock,
      color: "text-red-600",
    },
  ];

  if (loading) {
    return (
      <p className="p-4 text-sm text-slate-500 sm:p-6">
        Loading inventory...
      </p>
    );
  }

  return (
    <main className="mx-auto min-w-0 max-w-7xl space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
          Inventory Management
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Manage stock, monitor inventory and track stock movements.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="break-words rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 sm:p-4">
          {error}
        </div>
      )}

      {success && (
        <div className="break-words rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 sm:p-4">
          {success}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="min-w-0 rounded-xl border bg-white p-3 shadow-sm sm:p-5"
          >
            <p className="text-xs text-slate-500 sm:text-sm">
              {card.title}
            </p>

            <h2
              className={`mt-2 break-words text-xl font-bold sm:text-2xl ${card.color}`}
            >
              {card.value.toLocaleString()}
            </h2>
          </div>
        ))}
      </div>

      {/* Stock Action Form */}
      <section className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
            Manage Stock
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Choose an operation and update product stock.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-1 gap-2 min-[400px]:grid-cols-3">
          {(["stock-in", "stock-out", "adjustment"] as ActionType[]).map(
            (type) => (
              <button
                key={type}
                type="button"
                disabled={saving}
                onClick={() => {
                  setActionType(type);
                  setError("");
                  setSuccess("");
                }}
                className={`rounded-lg px-3 py-2.5 text-xs font-medium transition sm:text-sm ${
                  actionType === type
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {type === "stock-in"
                  ? "Stock In"
                  : type === "stock-out"
                    ? "Stock Out"
                    : "Adjustment"}
              </button>
            )
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleStockAction} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Select Product
            </label>

            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              disabled={saving}
              className={inputClass}
            >
              <option value="">Choose a product</option>

              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku}) - Stock: {product.stock}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <span className="text-blue-700">Selected Product:</span>{" "}
              <strong className="break-words">
                {selectedProduct.name}
              </strong>

              <p className="mt-1">
                Current Stock:{" "}
                <strong>{selectedProduct.stock}</strong>
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {actionType === "adjustment"
                ? "New Stock Quantity"
                : "Quantity"}
            </label>

            <input
              type="number"
              min={actionType === "adjustment" ? 0 : 1}
              step="1"
              required
              disabled={saving}
              value={actionType === "adjustment" ? newStock : quantity}
              onChange={(e) =>
                actionType === "adjustment"
                  ? setNewStock(e.target.value)
                  : setQuantity(e.target.value)
              }
              placeholder={
                actionType === "adjustment"
                  ? "Enter actual stock quantity"
                  : "Enter quantity"
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Note (Optional)
            </label>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              disabled={saving}
              placeholder="Write a note..."
              className={`${inputClass} resize-y`}
            />
          </div>

          <button
            type="submit"
            disabled={saving || products.length === 0}
            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {saving ? "Processing..." : "Submit"}
          </button>
        </form>
      </section>

      {/* Product Stock Table */}
      <section className="min-w-0 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b p-4 sm:p-5">
          <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
            Product Stock Overview
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Current stock level and product availability.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Reorder Level</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-slate-500"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isOutOfStock = product.stock === 0;
                  const isLowStock =
                    product.stock <= product.reorderLevel;

                  return (
                    <tr
                      key={product.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="max-w-[220px] break-words px-5 py-4 font-medium text-slate-800">
                        {product.name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {product.sku}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {product.category?.name ?? "Uncategorized"}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {product.stock}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {product.reorderLevel}
                      </td>

                      <td className="px-5 py-4">
                        {isOutOfStock ? (
                          <span className="whitespace-nowrap rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="whitespace-nowrap rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">
                            Low Stock
                          </span>
                        ) : (
                          <span className="whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="border-t px-4 py-2 text-center text-xs text-slate-400 sm:hidden">
          Swipe horizontally to view all columns
        </p>

        {/* Inventory History */}
        <div className="min-w-0 border-t">
          <InventoryHistory />
        </div>
      </section>
    </main>
  );
}
