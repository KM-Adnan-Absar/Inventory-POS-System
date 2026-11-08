
"use client";

import { useEffect, useState } from "react";

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

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState<SupplierForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      setSuppliers(data.suppliers ?? []);
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    }
  }

  const filteredSuppliers = suppliers.filter((supplier) =>
    `${supplier.name} ${supplier.companyName ?? ""} ${supplier.phone ?? ""} ${supplier.email ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Supplier Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your suppliers and their contact information.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-800">
          {editingId ? "Update Supplier" : "Add New Supplier"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Supplier Name *"
            required
            maxLength={100}
            className="rounded-lg border p-3 text-sm"
          />

          <input
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            placeholder="Company Name"
            className="rounded-lg border p-3 text-sm"
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            className="rounded-lg border p-3 text-sm"
          />

          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email Address"
            className="rounded-lg border p-3 text-sm"
          />

          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
            className="rounded-lg border p-3 text-sm"
          />

          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Notes"
            rows={2}
            className="rounded-lg border p-3 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
              className="rounded-lg border px-5 py-2.5 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Supplier List
            </h2>
            <p className="text-sm text-slate-500">
              Total Active Suppliers: {suppliers.length}
            </p>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers..."
            className="rounded-lg border p-2.5 text-sm sm:w-64"
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-slate-500">
            Loading suppliers...
          </p>
        ) : filteredSuppliers.length === 0 ? (
          <p className="py-8 text-center text-slate-500">
            No suppliers found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
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

              <tbody className="divide-y">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-800">
                      {supplier.name}
                    </td>
                    <td className="p-3">{supplier.companyName || "-"}</td>
                    <td className="p-3">{supplier.phone || "-"}</td>
                    <td className="p-3">{supplier.email || "-"}</td>
                    <td className="p-3">{supplier.address || "-"}</td>

                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="rounded bg-blue-50 px-3 py-1.5 text-blue-600 hover:bg-blue-100"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="rounded bg-red-50 px-3 py-1.5 text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
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
