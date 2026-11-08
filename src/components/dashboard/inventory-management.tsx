
"use client";

import { useEffect, useState } from "react";
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

      setProducts(productsData.products ?? []);
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

  const handleStockAction = async (e: React.FormEvent<HTMLFormElement>) => {
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
    { title: "Total Products", value: totalProducts, color: "text-slate-800" },
    { title: "Total Stock Units", value: totalStockUnits, color: "text-blue-600" },
    { title: "Low Stock Products", value: lowStockCount, color: "text-orange-600" },
    { title: "Out of Stock", value: outOfStock, color: "text-red-600" },
  ];

  if (loading) {
    return <p className="p-6 text-slate-500">Loading inventory...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Inventory Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage stock, monitor inventory and track stock movements.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.title} className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.title}</p>
            <h2 className={`mt-2 text-2xl font-bold ${card.color}`}>
              {card.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Stock Action Form */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">
          Manage Stock
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["stock-in", "stock-out", "adjustment"] as ActionType[]).map(
            (type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setActionType(type);
                  setError("");
                  setSuccess("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  actionType === type
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {type === "stock-in"
                  ? "Stock In"
                  : type === "stock-out"
                    ? "Stock Out"
                    : "Stock Adjustment"}
              </button>
            )
          )}
        </div>

        <form onSubmit={handleStockAction} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Select Product
            </label>

            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
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
            <p className="text-sm text-slate-500">
              Current Stock: <strong>{selectedProduct.stock}</strong>
            </p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {actionType === "adjustment" ? "New Stock Quantity" : "Quantity"}
            </label>

            <input
              type="number"
              min={actionType === "adjustment" ? 0 : 1}
              step="1"
              required
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Note (Optional)
            </label>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Write a note..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving || products.length === 0}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Processing..." : "Submit"}
          </button>
        </form>
      </div>

      {/* Product Stock Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Product Stock Overview
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
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

            <tbody className="divide-y">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isOutOfStock = product.stock === 0;
                  const isLowStock = product.stock <= product.reorderLevel;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-medium">{product.name}</td>
                      <td className="px-5 py-4">{product.sku}</td>
                      <td className="px-5 py-4">
                        {product.category?.name ?? "Uncategorized"}
                      </td>
                      <td className="px-5 py-4 font-semibold">{product.stock}</td>
                      <td className="px-5 py-4">{product.reorderLevel}</td>
                      <td className="px-5 py-4">
                        {isOutOfStock ? (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">
                            Low Stock
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
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
          <InventoryHistory />
        </div>
      </div>
    </div>
  );
}
