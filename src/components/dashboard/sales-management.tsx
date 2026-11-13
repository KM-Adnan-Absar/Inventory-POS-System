
"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  sku: string;
  sellingPrice: string;
  stock: number;
};

type CartItem = {
  product: Product;
  quantity: number;
};

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function SalesManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load products
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/sales");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load products.");
        }

        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load products."
        );
      }
    }

    loadProducts();
  }, []);

  // Search products
  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.sku}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Calculate subtotal
  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        Number(item.product.sellingPrice) * item.quantity,
      0
    );
  }, [cart]);

  const discountAmount = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountAmount);
  const paid = Number(paidAmount) || 0;
  const change = Math.max(0, paid - total);

  // Add product to cart
  function addToCart(product: Product) {
    setError("");
    setMessage("");

    if (product.stock <= 0) {
      setError("Product is out of stock.");
      return;
    }

    setCart((previous) => {
      const existing = previous.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        if (existing.quantity >= product.stock) {
          setError("Maximum available stock reached.");
          return previous;
        }

        return previous.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...previous, { product, quantity: 1 }];
    });
  }

  // Update quantity
  function updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((previous) =>
      previous.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: Math.min(quantity, item.product.stock),
            }
          : item
      )
    );
  }

  // Remove product
  function removeFromCart(productId: number) {
    setCart((previous) =>
      previous.filter((item) => item.product.id !== productId)
    );
  }

  // Checkout
  async function handleCheckout() {
    setError("");
    setMessage("");

    if (cart.length === 0) {
      setError("Please add products to cart.");
      return;
    }

    if (discountAmount > subtotal) {
      setError("Discount cannot exceed subtotal.");
      return;
    }

    if (paid < total) {
      setError("Paid amount is less than total.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          discount: discountAmount,
          paidAmount: paid,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Checkout failed.");
      }

      setMessage(
        `Sale completed! Invoice: ${data.sale.invoiceNumber}`
      );

      // Update stock locally
      setProducts((previous) =>
        previous.map((product) => {
          const soldItem = cart.find(
            (item) => item.product.id === product.id
          );

          return soldItem
            ? {
                ...product,
                stock: product.stock - soldItem.quantity,
              }
            : product;
        })
      );

      setCart([]);
      setDiscount("0");
      setPaidAmount("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Checkout failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-w-0 max-w-7xl space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Sales Management
        </h1>

        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Search products, manage cart and complete sales.
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div className="break-words rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="break-words rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid min-w-0 gap-5 lg:grid-cols-3 lg:gap-6">
        {/* Product Section */}
        <section className="min-w-0 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              Products
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Available products: {products.length}
            </p>
          </div>

          {/* Search */}
          <input
            type="search"
            placeholder="Search product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
          />

          {/* Product Cards */}
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-2">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex min-w-0 flex-col justify-between gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-200 hover:bg-slate-50 sm:p-4"
              >
                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-slate-800">
                    {product.name}
                  </h3>

                  <p className="mt-1 break-all text-xs text-slate-500">
                    SKU: {product.sku}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-blue-600 sm:text-lg">
                      ৳{product.sellingPrice}
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        product.stock <= 0
                          ? "text-red-600"
                          : product.stock <= 5
                            ? "text-orange-600"
                            : "text-slate-500"
                      }`}
                    >
                      Stock: {product.stock}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:px-4 sm:text-sm"
                  >
                    {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="rounded-lg bg-slate-50 py-10 text-center">
              <p className="text-sm text-slate-500">
                No products found.
              </p>
            </div>
          )}
        </section>

        {/* Cart Section */}
        <section className="min-w-0 space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              Shopping Cart
            </h2>

            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {cart.length} items
            </span>
          </div>

          {/* Cart Items */}
          <div className="max-h-[420px] space-y-4 overflow-y-auto">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="min-w-0 border-b border-slate-100 pb-4"
              >
                <div className="flex min-w-0 justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-slate-800">
                      {item.product.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      ৳{item.product.sellingPrice} each
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        item.product.id,
                        item.quantity - 1
                      )
                    }
                    className="h-8 w-8 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50"
                  >
                    -
                  </button>

                  <span className="min-w-6 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        item.product.id,
                        item.quantity + 1
                      )
                    }
                    disabled={item.quantity >= item.product.stock}
                    className="h-8 w-8 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
                  >
                    +
                  </button>

                  <span className="ml-auto text-sm font-semibold text-slate-800">
                    ৳
                    {(
                      Number(item.product.sellingPrice) *
                      item.quantity
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="rounded-lg bg-slate-50 py-8 text-center">
                <p className="text-sm text-slate-400">
                  Your cart is empty.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Add products to start a sale.
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium text-slate-800">
                ৳{subtotal.toFixed(2)}
              </span>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Discount (৳)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex justify-between gap-3 border-t border-dashed border-slate-200 pt-3 text-sm font-bold">
              <span className="text-slate-800">Total</span>
              <span className="text-blue-600">
                ৳{total.toFixed(2)}
              </span>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Payment Method
              </label>

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={inputClass}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="ROCKET">Rocket</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Paid Amount (৳)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className={inputClass}
                placeholder="Enter paid amount"
              />
            </div>

            <div className="flex justify-between gap-3 rounded-lg bg-green-50 p-3 text-sm">
              <span className="font-medium text-green-700">
                Change
              </span>

              <span className="font-bold text-green-700">
                ৳{change.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "Processing..." : "Complete Sale"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
