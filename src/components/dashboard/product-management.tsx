
"use client";

import { useEffect, useState, type FormEvent } from "react";

type Category = {
  id: number;
  name: string;
  description?: string | null;
};

type Product = {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  costPrice: string;
  sellingPrice: string;
  reorderLevel: number;
  isActive: boolean;
  categoryId: number;
  category: Category;
};

type ProductForm = {
  name: string;
  sku: string;
  barcode: string;
  description: string;
  costPrice: string;
  sellingPrice: string;
  reorderLevel: string;
  categoryId: string;
  isActive: boolean;
};

const initialForm: ProductForm = {
  name: "",
  sku: "",
  barcode: "",
  description: "",
  costPrice: "",
  sellingPrice: "",
  reorderLevel: "5",
  categoryId: "",
  isActive: true,
};

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm>(initialForm);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  const [searchValue, setSearchValue] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load products and categories
  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load products.");
      }

      setProducts(result.products);
      setCategories(result.categories);
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
    loadProducts();
  }, []);

  // Update product form
  function updateField(
    field: keyof ProductForm,
    value: string | boolean
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // Reset product form
  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  // Create category
  async function handleCreateCategory(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setCategorySaving(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          description: categoryDescription.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to create category."
        );
      }

      setMessage(result.message);
      setCategoryName("");
      setCategoryDescription("");

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setCategorySaving(false);
    }
  }

  // Edit product
  function handleEdit(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || "",
      description: product.description || "",
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      reorderLevel: String(product.reorderLevel),
      categoryId: String(product.categoryId),
      isActive: product.isActive,
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Create or update product
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const payload = {
        ...form,
        name: form.name.trim(),
        sku: form.sku.trim(),
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        reorderLevel: Number(form.reorderLevel),
        barcode: form.barcode.trim() || null,
        categoryId: form.categoryId,
        description: form.description.trim() || null,
      };

      const isEditing = editingId !== null;

      const response = await fetch(
        isEditing ? `/api/products/${editingId}` : "/api/products",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save product.");
      }

      setMessage(result.message);
      resetForm();

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  // Soft delete product
  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this product?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete product.");
      }

      setMessage(result.message);

      if (editingId === id) {
        resetForm();
      }

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // Search products
  const filteredProducts = products.filter((product) => {
    const search = searchValue.toLowerCase();

    return (
      product.name.toLowerCase().includes(search) ||
      product.sku.toLowerCase().includes(search) ||
      product.category.name.toLowerCase().includes(search)
    );
  });

  return (
    <main className="space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Product Management
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Create, update and manage your store products and categories.
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Category Management */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Category Management
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create categories before adding products.
          </p>
        </div>

        <form
          onSubmit={handleCreateCategory}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">
              Category Name *
            </label>

            <input
              required
              minLength={2}
              maxLength={50}
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Electronics"
              className="w-full rounded-lg border p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>

            <input
              value={categoryDescription}
              onChange={(e) =>
                setCategoryDescription(e.target.value)
              }
              placeholder="Optional description"
              className="w-full rounded-lg border p-2.5 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={categorySaving}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {categorySaving ? "Creating..." : "Create Category"}
            </button>
          </div>
        </form>

        {/* Category List */}
        <div className="mt-6 border-t pt-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Available Categories ({categories.length})
          </h3>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category.id}
                className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700"
              >
                {category.name}
              </span>
            ))}

            {categories.length === 0 && (
              <p className="text-sm text-slate-500">
                No categories created yet.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Product Form */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId !== null ? "Edit Product" : "Add New Product"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter product information below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">

          {/* Product Name */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Product Name *
            </label>

            <input
              required
              minLength={2}
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full rounded-lg border p-2.5 text-sm"
              placeholder="Enter product name"
            />
          </div>

          {/* SKU */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              SKU *
            </label>

            <input
              required
              value={form.sku}
              onChange={(e) => updateField("sku", e.target.value)}
              className="w-full rounded-lg border p-2.5 text-sm"
              placeholder="e.g. PRD-001"
            />
          </div>

          {/* Barcode */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Barcode
            </label>

            <input
              value={form.barcode}
              onChange={(e) => updateField("barcode", e.target.value)}
              className="w-full rounded-lg border p-2.5 text-sm"
              placeholder="Optional barcode"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Category *
            </label>

            <select
              required
              value={form.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
              className="w-full rounded-lg border bg-white p-2.5 text-sm"
            >
              <option value="">Select category</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cost Price */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Cost Price (৳) *
            </label>

            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.costPrice}
              onChange={(e) => updateField("costPrice", e.target.value)}
              className="w-full rounded-lg border p-2.5 text-sm"
              placeholder="0.00"
            />
          </div>

          {/* Selling Price */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Selling Price (৳) *
            </label>

            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.sellingPrice}
              onChange={(e) => updateField("sellingPrice", e.target.value)}
              className="w-full rounded-lg border p-2.5 text-sm"
              placeholder="0.00"
            />
          </div>

          {/* Reorder Level */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Reorder Level
            </label>

            <input
              required
              type="number"
              min="0"
              step="1"
              value={form.reorderLevel}
              onChange={(e) => updateField("reorderLevel", e.target.value)}
              className="w-full rounded-lg border p-2.5 text-sm"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2 pt-6">
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
              className="h-4 w-4"
            />

            <label htmlFor="isActive" className="text-sm">
              Active Product
            </label>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>

            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full rounded-lg border p-2.5 text-sm"
              placeholder="Product description..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={saving || categories.length === 0}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Product"
                  : "Create Product"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border px-5 py-2.5 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {categories.length === 0 && !loading && (
          <p className="mt-4 text-sm text-orange-600">
            No categories found. Create a category before adding a product.
          </p>
        )}
      </section>

      {/* Product List */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Product List ({filteredProducts.length})
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and manage all your products.
            </p>
          </div>

          {/* Search */}
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search name, SKU, category..."
            className="w-full rounded-lg border p-2.5 text-sm sm:max-w-xs"
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-slate-500">
            Loading products...
          </p>
        ) : filteredProducts.length === 0 ? (
          <p className="py-8 text-center text-slate-500">
            No products found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500">
                  <th className="p-3">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Cost</th>
                  <th className="p-3">Selling</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-slate-50">

                    <td className="p-3 font-medium text-slate-900">
                      {product.name}
                    </td>

                    <td className="p-3">{product.sku}</td>

                    <td className="p-3">
                      {product.category?.name ?? "Uncategorized"}
                    </td>

                    <td className="p-3">
                      ৳{product.costPrice}
                    </td>

                    <td className="p-3">
                      ৳{product.sellingPrice}
                    </td>

                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          product.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="font-medium text-blue-600"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === product.id}
                          onClick={() => handleDelete(product.id)}
                          className="font-medium text-red-600 disabled:opacity-50"
                        >
                          {deletingId === product.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
