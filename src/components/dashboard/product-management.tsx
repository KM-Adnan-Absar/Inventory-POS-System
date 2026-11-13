
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

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

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

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load products.");
      }

      setProducts(Array.isArray(result.products) ? result.products : []);
      setCategories(Array.isArray(result.categories) ? result.categories : []);
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

  function updateField(
    field: keyof ProductForm,
    value: string | boolean
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

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
        throw new Error(result.message || "Failed to create category.");
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

  const filteredProducts = products.filter((product) => {
    const search = searchValue.toLowerCase();

    return (
      product.name.toLowerCase().includes(search) ||
      product.sku.toLowerCase().includes(search) ||
      (product.category?.name ?? "").toLowerCase().includes(search)
    );
  });

  return (
    <main className="min-w-0 space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Product Management
        </h1>

        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Create, update and manage your store products and categories.
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

      {/* Category Management */}
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 sm:mb-5">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Category Management
          </h2>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Create categories before adding products.
          </p>
        </div>

        <form
          onSubmit={handleCreateCategory}
          className="grid min-w-0 gap-4 sm:grid-cols-2"
        >
          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Category Name *
            </label>

            <input
              required
              minLength={2}
              maxLength={50}
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Electronics"
              className={inputClass}
            />
          </div>

          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>

            <input
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              placeholder="Optional description"
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={categorySaving}
              className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {categorySaving ? "Creating..." : "Create Category"}
            </button>
          </div>
        </form>

        {/* Category List */}
        <div className="mt-5 border-t border-slate-100 pt-4 sm:mt-6 sm:pt-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Available Categories ({categories.length})
          </h3>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category.id}
                className="max-w-full break-words rounded-full bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 sm:text-sm"
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
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 sm:mb-5">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            {editingId !== null ? "Edit Product" : "Add New Product"}
          </h2>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Enter product information below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Product Name *
            </label>

            <input
              required
              minLength={2}
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={inputClass}
              placeholder="Enter product name"
            />
          </div>

          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              SKU *
            </label>

            <input
              required
              value={form.sku}
              onChange={(e) => updateField("sku", e.target.value)}
              className={inputClass}
              placeholder="e.g. PRD-001"
            />
          </div>

          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Barcode
            </label>

            <input
              value={form.barcode}
              onChange={(e) => updateField("barcode", e.target.value)}
              className={inputClass}
              placeholder="Optional barcode"
            />
          </div>

          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Category *
            </label>

            <select
              required
              value={form.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
              className={inputClass}
            >
              <option value="">Select category</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Cost Price (৳) *
            </label>

            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.costPrice}
              onChange={(e) => updateField("costPrice", e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          </div>

          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Selling Price (৳) *
            </label>

            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.sellingPrice}
              onChange={(e) => updateField("sellingPrice", e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          </div>

          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Reorder Level
            </label>

            <input
              required
              type="number"
              min="0"
              step="1"
              value={form.reorderLevel}
              onChange={(e) => updateField("reorderLevel", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex min-w-0 items-center gap-2 sm:pt-7">
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-slate-300"
            />

            <label htmlFor="isActive" className="text-sm text-slate-700">
              Active Product
            </label>
          </div>

          <div className="min-w-0 sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className={inputClass}
              placeholder="Product description..."
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:col-span-2 sm:flex-row sm:gap-3">
            <button
              type="submit"
              disabled={saving || categories.length === 0}
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
                className="w-full rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {categories.length === 0 && !loading && (
          <p className="mt-4 rounded-lg bg-orange-50 p-3 text-xs text-orange-700 sm:text-sm">
            No categories found. Create a category before adding a product.
          </p>
        )}
      </section>

      {/* Product List */}
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex min-w-0 flex-col justify-between gap-3 sm:mb-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              Product List ({filteredProducts.length})
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              View and manage all your products.
            </p>
          </div>

          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search name, SKU, category..."
            className={`${inputClass} sm:max-w-xs`}
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Loading products...
          </p>
        ) : filteredProducts.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No products found.
          </p>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500">
                  <th className="whitespace-nowrap p-3">Product</th>
                  <th className="whitespace-nowrap p-3">SKU</th>
                  <th className="whitespace-nowrap p-3">Category</th>
                  <th className="whitespace-nowrap p-3">Cost</th>
                  <th className="whitespace-nowrap p-3">Selling</th>
                  <th className="whitespace-nowrap p-3">Status</th>
                  <th className="whitespace-nowrap p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >
                    <td className="max-w-[220px] break-words p-3 font-medium text-slate-900">
                      {product.name}
                    </td>

                    <td className="whitespace-nowrap p-3">{product.sku}</td>

                    <td className="whitespace-nowrap p-3">
                      {product.category?.name ?? "Uncategorized"}
                    </td>

                    <td className="whitespace-nowrap p-3">
                      ৳{product.costPrice}
                    </td>

                    <td className="whitespace-nowrap p-3">
                      ৳{product.sellingPrice}
                    </td>

                    <td className="whitespace-nowrap p-3">
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

                    <td className="whitespace-nowrap p-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === product.id}
                          onClick={() => handleDelete(product.id)}
                          className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
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

        {!loading && filteredProducts.length > 0 && (
          <p className="mt-2 text-center text-xs text-slate-400 sm:hidden">
            Swipe horizontally to view all columns
          </p>
        )}
      </section>
    </main>
  );
}
