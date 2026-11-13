
"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";

type Supplier = {
  id: number;
  name: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
};

type SupplierForm = {
  name: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const initialForm: SupplierForm = {
  name: "",
  companyName: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState<SupplierForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function fetchSuppliers() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/suppliers");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load suppliers.");
      }

      setSuppliers(
        Array.isArray(data.suppliers) ? data.suppliers : []
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
    fetchSuppliers();
  }, []);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleEdit(supplier: Supplier) {
    setEditingId(supplier.id);

    setForm({
      name: supplier.name,
      companyName: supplier.companyName ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      notes: supplier.notes ?? "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const url = editingId
        ? `/api/suppliers/${editingId}`
        : "/api/suppliers";

      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save supplier.");
      }

      resetForm();
      await fetchSuppliers();
      alert(data.message);
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
      "Are you sure you want to deactivate this supplier?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");

      const res = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete supplier.");
      }

      await fetchSuppliers();
      alert(data.message);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredSuppliers = suppliers.filter((supplier) =>
    `${supplier.name} ${supplier.companyName ?? ""} ${supplier.phone ?? ""} ${supplier.email ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="mx-auto min-w-0 max-w-7xl space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
          Supplier Management
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Manage your suppliers and their contact information.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="break-words rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Supplier Form */}
      <form
        onSubmit={handleSubmit}
        className="min-w-0 space-y-4 rounded-xl border bg-white p-4 shadow-sm sm:p-6"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
            {editingId ? "Update Supplier" : "Add New Supplier"}
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {editingId
              ? "Update the supplier's contact information."
              : "Enter the supplier's details below."}
          </p>
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Supplier Name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter supplier name"
              required
              maxLength={100}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Company Name
            </label>
            <input
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              placeholder="Enter company name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Phone Number
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email address"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Address
            </label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter address"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Additional information..."
              rows={2}
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col gap-2 border-t pt-4 min-[400px]:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 min-[400px]:w-auto"
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update Supplier"
                : "Add Supplier"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 min-[400px]:w-auto"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Supplier List */}
      <section className="min-w-0 overflow-hidden rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex min-w-0 flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
              Supplier List
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Total Active Suppliers: {suppliers.length}
            </p>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers..."
            className={`${inputClass} sm:max-w-xs`}
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Loading suppliers...
          </p>
        ) : filteredSuppliers.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No suppliers found.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Company</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Address</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="max-w-[180px] break-words p-3 font-medium text-slate-800">
                        {supplier.name}
                      </td>

                      <td className="max-w-[180px] break-words p-3">
                        {supplier.companyName || "-"}
                      </td>

                      <td className="whitespace-nowrap p-3">
                        {supplier.phone || "-"}
                      </td>

                      <td className="max-w-[200px] break-all p-3">
                        {supplier.email || "-"}
                      </td>

                      <td className="max-w-[200px] break-words p-3">
                        {supplier.address || "-"}
                      </td>

                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(supplier)}
                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(supplier.id)}
                            disabled={deletingId === supplier.id}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === supplier.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
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
