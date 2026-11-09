
"use client";

import { useEffect, useState } from "react";

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

      const [supplierRes, productRes, purchaseRes] =
        await Promise.all([
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

      setSuppliers(supplierData.suppliers ?? []);
      setProducts(productData.products ?? []);
      setPurchases(purchaseData.purchases ?? []);
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
          const product = products.find(
            (p) => p.id === Number(value)
          );

          updated.costPrice = product
            ? Number(product.costPrice)
            : 0;
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    return <p className="p-8 text-center">Loading purchase management...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Purchase Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage supplier purchases and stock receiving.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Create New Purchase</h2>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Select Supplier
          </label>

          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            required
            className="w-full rounded-lg border p-3 text-sm"
          >
            <option value="">Choose Supplier</option>

            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
                {supplier.companyName
                  ? ` - ${supplier.companyName}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Purchase Items</h3>

            <button
              type="button"
              onClick={addItem}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              + Add Product
            </button>
          </div>

          {items.length === 0 && (
            <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">
              No products added yet.
            </p>
          )}

          {items.map((item, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Product
                </label>

                <select
                  value={item.productId}
                  onChange={(e) =>
                    updateItem(index, "productId", e.target.value)
                  }
                  className="w-full rounded-lg border p-2.5 text-sm"
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
                <label className="mb-1 block text-xs font-medium">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(
                      index,
                      "quantity",
                      Number(e.target.value)
                    )
                  }
                  className="w-full rounded-lg border p-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
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
                  className="w-full rounded-lg border p-2.5 text-sm"
                  required
                />
              </div>

              <div className="flex items-end justify-between gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Line Total
                  </label>
                  <p className="font-semibold">
                    ৳{(item.quantity * item.costPrice).toFixed(2)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Discount
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full rounded-lg border p-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Paid Amount
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full rounded-lg border p-3 text-sm"
            />
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-sm text-slate-500">Due Amount</p>
            <p className="text-xl font-bold text-red-600">
              ৳{due.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-slate-50 p-4">
          <div className="flex justify-between py-1 text-sm">
            <span>Subtotal</span>
            <span>৳{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between py-1 text-sm">
            <span>Discount</span>
            <span>- ৳{discountValue.toFixed(2)}</span>
          </div>

          <div className="mt-2 flex justify-between border-t pt-3 text-lg font-bold">
            <span>Grand Total</span>
            <span>৳{total.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || suppliers.length === 0 || products.length === 0}
          className="rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? "Processing Purchase..." : "Complete Purchase"}
        </button>
      </form>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Purchase History</h2>

        {purchases.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No purchases found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
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

              <tbody className="divide-y">
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="p-3 font-medium">
                      {purchase.invoiceNumber}
                    </td>
                    <td className="p-3">
                      {purchase.supplier.name}
                    </td>
                    <td className="p-3">
                      {purchase.items.length}
                    </td>
                    <td className="p-3">
                      ৳{Number(purchase.total).toFixed(2)}
                    </td>
                    <td className="p-3">
                      ৳{Number(purchase.paidAmount).toFixed(2)}
                    </td>
                    <td className="p-3 text-red-600">
                      ৳{Number(purchase.dueAmount).toFixed(2)}
                    </td>
                    <td className="p-3">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
