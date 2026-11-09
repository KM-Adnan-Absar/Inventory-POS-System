
"use client";

import { useEffect, useState } from "react";

type Expense = {
  id: number;
  title: string;
  category: string;
  amount: string | number;
  description: string | null;
  paymentMethod: string;
  expenseDate: string;
  createdBy?: {
    name: string;
  };
};

const paymentMethods = ["CASH", "CARD", "BKASH", "NAGAD", "ROCKET"];

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Utilities");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const fetchExpenses = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/expenses");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch expenses.");
      }

      setExpenses(data.expenses || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExpenses();
  }, []);

  const totalExpense = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim() || !amount || Number(amount) <= 0) {
      alert("Please enter a valid title and amount.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          category,
          amount: Number(amount),
          description,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create expense.");
      }

      alert("Expense added successfully!");

      setTitle("");
      setCategory("Utilities");
      setAmount("");
      setDescription("");
      setPaymentMethod("CASH");

      await fetchExpenses();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Expense Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track and manage your business expenses.
        </p>
      </div>

      {/* Total Expense */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Total Expenses</p>
        <h2 className="mt-2 text-3xl font-bold text-red-600">
          ৳{totalExpense.toLocaleString("en-BD")}
        </h2>
      </div>

      {/* Add Expense Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-800">
          Add New Expense
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Expense Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Electricity Bill"
              className="w-full rounded-lg border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="Utilities">Utilities</option>
              <option value="Rent">Rent</option>
              <option value="Salary">Salary</option>
              <option value="Transport">Transport</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Marketing">Marketing</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Amount (৳)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full rounded-lg border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write expense details..."
            rows={3}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add Expense"}
        </button>
      </form>

      {/* Expense History */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Expense History
          </h2>
        </div>

        {loading ? (
          <p className="p-5 text-slate-500">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="p-5 text-slate-500">No expenses found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-t">
                    <td className="p-3 font-medium">{expense.title}</td>
                    <td className="p-3">{expense.category}</td>
                    <td className="p-3 font-semibold text-red-600">
                      ৳{Number(expense.amount).toLocaleString("en-BD")}
                    </td>
                    <td className="p-3">{expense.paymentMethod}</td>
                    <td className="p-3">
                      {new Date(expense.expenseDate).toLocaleDateString(
                        "en-GB"
                      )}
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
