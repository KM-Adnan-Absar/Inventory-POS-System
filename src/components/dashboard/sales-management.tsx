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
          throw new Error(data.message);
        }

        setProducts(data.products);
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
        throw new Error(data.message);
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
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Sales Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Search products, manage cart and complete sales.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-green-100 p-3 text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Section */}
        <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800">
            Products
          </h2>

          <input
            type="text"
            placeholder="Search product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-lg border p-4"
              >
                <h3 className="font-semibold text-gray-800">
                  {product.name}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  SKU: {product.sku}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-blue-600">
                      ৳{product.sellingPrice}
                    </p>

                    <p className="text-xs text-gray-500">
                      Stock: {product.stock}
                    </p>
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <p className="py-8 text-center text-gray-500">
              No products found.
            </p>
          )}
        </div>

        {/* Cart Section */}
        <div className="space-y-5 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            Shopping Cart ({cart.length})
          </h2>

          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="border-b pb-4"
              >
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {item.product.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      ৳{item.product.sellingPrice} each
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      removeFromCart(item.product.id)
                    }
                    className="text-sm text-red-500"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.product.id,
                        item.quantity - 1
                      )
                    }
                    className="rounded border px-3 py-1"
                  >
                    -
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() =>
                      updateQuantity(
                        item.product.id,
                        item.quantity + 1
                      )
                    }
                    disabled={item.quantity >= item.product.stock}
                    className="rounded border px-3 py-1 disabled:opacity-40"
                  >
                    +
                  </button>

                  <span className="ml-auto font-semibold">
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
              <p className="py-6 text-center text-gray-400">
                Your cart is empty.
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>

            <div>
              <label className="mb-1 block text-sm">
                Discount (৳)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>৳{total.toFixed(2)}</span>
            </div>

            <div>
              <label className="mb-1 block text-sm">
                Payment Method
              </label>

              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value)
                }
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="ROCKET">Rocket</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm">
                Paid Amount (৳)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={(e) =>
                  setPaidAmount(e.target.value)
                }
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Enter paid amount"
              />
            </div>

            <div className="flex justify-between text-green-600">
              <span>Change</span>
              <span>৳{change.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? "Processing..." : "Complete Sale"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}