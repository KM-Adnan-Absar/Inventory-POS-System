
"use client";

import { useEffect, useState, type FormEvent } from "react";

type Supplier = {
  id: number;
  name: string;
  companyName: string | null;
};

type Product = {
  id: number;
  name: string;
  sku: string;
  costPrice: string;
  stock: number;
};

type PurchaseItem = {
  productId: string;
  quantity: number;
  costPrice: number;
};

type Purchase = {
  id: number;
  invoiceNumber: string;
  subtotal: string;
  discount: string;
  total: string;
  paidAmount: string;
  dueAmount: string;
  createdAt: string;
  supplier: {
    name: string;
    companyName: string | null;
  };
  items: {
    id: number;
    productName: string;
    sku: string;
    quantity: number;
    costPrice: string;
    lineTotal: string;
  }[];
};

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function PurchaseManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("0");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [supplierRes, productRes, purchaseRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/products"),
        fetch("/api/purchases"),
      ]);

      const supplierData = await supplierRes.json();
      const productData = await productRes.json();
      const purchaseData = await purchaseRes.json();

      if (!supplierRes.ok) {
        throw new Error(supplierData.message || "Failed to load suppliers.");
      }

      if (!productRes.ok) {
        throw new Error(productData.message || "Failed to load products.");
      }

      if (!purchaseRes.ok) {
        throw new Error(purchaseData.message || "Failed to load purchases.");
      }

      setSuppliers(
        Array.isArray(supplierData.suppliers)
          ? supplierData.suppliers
          : []
      );

      setProducts(
        Array.isArray(productData.products) ? productData.products : []
      );

      setPurchases(
        Array.isArray(purchaseData.purchases)
          ? purchaseData.purchases
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        productId: "",
        quantity: 1,
        costPrice: 0,
      },
    ]);
  }

  function updateItem(
    index: number,
    field: keyof PurchaseItem,
    value: string | number
  ) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const updated = { ...item, [field]: value };

        if (field === "productId") {
          const product = products.find((p) => p.id === Number(value));

          updated.costPrice = product ? Number(product.costPrice) : 0;
        }

        return updated;
      })
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.costPrice,
    0
  );

  const discountValue = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountValue);
  const paid = Math.max(0, Number(paidAmount) || 0);
  const due = Math.max(0, total - paid);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!supplierId) {
        throw new Error("Please select a supplier.");
      }

      if (items.length === 0) {
        throw new Error("Please add at least one product.");
      }

      if (discountValue > subtotal) {
        throw new Error("Discount cannot exceed subtotal.");
      }

      if (paid > total) {
        throw new Error("Paid amount cannot exceed total.");
      }

      if (
        items.some(
          (item) =>
            !item.productId ||
            !Number.isInteger(item.quantity) ||
            item.quantity <= 0 ||
            !Number.isFinite(item.costPrice) ||
            item.costPrice <= 0
        )
      ) {
        throw new Error("Please provide valid product information.");
      }

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplierId: Number(supplierId),
          discount: discountValue,
          paidAmount: paid,
          items: items.map((item) => ({
            productId: Number(item.productId),
            quantity: item.quantity,
            costPrice: item.costPrice,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Purchase failed.");
      }

      alert(data.message);

      setSupplierId("");
      setItems([]);
      setDiscount("0");
      setPaidAmount("0");

      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="p-5 text-center text-sm text-slate-500 sm:p-8">
        Loading purchase management...
      </p>
    );
  }

  return (
    <main className="mx-auto min-w-0 max-w-7xl space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
          Purchase Management
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Manage supplier purchases and stock receiving.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="break-words rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Create Purchase Form */}
      <form
        onSubmit={handleSubmit}
        className="min-w-0 space-y-5 rounded-xl border bg-white p-4 shadow-sm sm:p-6"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
            Create New Purchase
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Select a supplier and add the products you received.
          </p>
        </div>

        {/* Supplier */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Select Supplier
          </label>

          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            required
            disabled={saving}
            className={inputClass}
          >
            <option value="">Choose Supplier</option>

            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
                {supplier.companyName ? ` - ${supplier.companyName}` : ""}
              </option>
            ))}
          </select>

          {suppliers.length === 0 && (
            <p className="mt-1.5 text-xs text-orange-600">
              No suppliers available. Add a supplier first.
            </p>
          )}
        </div>

        {/* Purchase Items */}
        <section className="min-w-0 space-y-4">
          <div className="flex flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">
                Purchase Items
              </h3>
              <p className="text-xs text-slate-500">
                {items.length} item(s) added
              </p>
            </div>

            <button
              type="button"
              onClick={addItem}
              disabled={saving || products.length === 0}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 min-[400px]:w-auto"
            >
              + Add Product
            </button>
          </div>

          {products.length === 0 && (
            <p className="rounded-lg bg-orange-50 p-3 text-sm text-orange-700">
              No products available. Add a product first.
            </p>
          )}

          {items.length === 0 && (
            <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">
              No products added yet.
            </p>
          )}

          {items.map((item, index) => (
            <div
              key={index}
              className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-700">
                  Product #{index + 1}
                </h4>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={saving}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="min-w-0 lg:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Product
                  </label>

                  <select
                    value={item.productId}
                    onChange={(e) =>
                      updateItem(index, "productId", e.target.value)
                    }
                    disabled={saving}
                    className={inputClass}
                    required
                  >
                    <option value="">Select Product</option>

                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, "quantity", Number(e.target.value))
                    }
                    disabled={saving}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Cost Price
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.costPrice || ""}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "costPrice",
                        Number(e.target.value)
                      )
                    }
                    disabled={saving}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 px-3 py-2.5">
                <span className="text-xs font-medium text-blue-700">
                  Line Total
                </span>
                <strong className="text-sm text-blue-800">
                  ৳{(item.quantity * item.costPrice).toFixed(2)}
                </strong>
              </div>
            </div>
          ))}
        </section>

        {/* Discount and Payment */}
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Discount
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              disabled={saving}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Paid Amount
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              disabled={saving}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col justify-center rounded-lg border border-red-100 bg-red-50 p-3 sm:col-span-2 lg:col-span-1">
            <p className="text-xs text-red-600 sm:text-sm">
              Due Amount
            </p>
            <p className="mt-1 text-xl font-bold text-red-600">
              ৳{due.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Purchase Summary */}
        <div className="rounded-xl border bg-slate-50 p-3 sm:p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            Purchase Summary
          </h3>

          <div className="flex justify-between gap-3 py-1.5 text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium tabular-nums">
              ৳{subtotal.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between gap-3 py-1.5 text-sm">
            <span className="text-slate-600">Discount</span>
            <span className="font-medium tabular-nums">
              - ৳{discountValue.toFixed(2)}
            </span>
          </div>

          <div className="mt-2 flex justify-between gap-3 border-t border-slate-200 pt-3 text-base font-bold sm:text-lg">
            <span>Grand Total</span>
            <span className="tabular-nums">৳{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={
            saving || suppliers.length === 0 || products.length === 0
          }
          className="w-full rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {saving ? "Processing Purchase..." : "Complete Purchase"}
        </button>
      </form>

      {/* Purchase History */}
      <section className="min-w-0 overflow-hidden rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
            Purchase History
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Previously recorded supplier purchases.
          </p>
        </div>

        {purchases.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No purchases found.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">Invoice</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Paid</th>
                    <th className="p-3">Due</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {purchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap p-3 font-medium text-slate-800">
                        {purchase.invoiceNumber}
                      </td>

                      <td className="max-w-[180px] break-words p-3">
                        {purchase.supplier.name}
                      </td>

                      <td className="p-3">{purchase.items.length}</td>

                      <td className="whitespace-nowrap p-3">
                        ৳{Number(purchase.total).toFixed(2)}
                      </td>

                      <td className="whitespace-nowrap p-3">
                        ৳{Number(purchase.paidAmount).toFixed(2)}
                      </td>

                      <td className="whitespace-nowrap p-3 font-medium text-red-600">
                        ৳{Number(purchase.dueAmount).toFixed(2)}
                      </td>

                      <td className="whitespace-nowrap p-3">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-2 text-center text-xs text-slate-400 sm:hidden">
              Swipe horizontally to view all columns
            </p>
          </>
        )}
      </section>
    </main>
  );
}
