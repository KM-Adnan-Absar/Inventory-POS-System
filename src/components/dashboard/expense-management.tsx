
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

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

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

      setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
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
    <div className="min-w-0 space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
          Expense Management
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Track and manage your business expenses.
        </p>
      </div>

      {/* Total Expense */}
      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <p className="text-xs text-slate-500 sm:text-sm">
          Total Expenses
        </p>
        <h2 className="mt-2 text-2xl font-bold text-red-600 sm:text-3xl">
          ৳{totalExpense.toLocaleString("en-BD")}
        </h2>
      </div>

      {/* Add Expense Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border bg-white p-4 shadow-sm sm:space-y-5 sm:p-5"
      >
        <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
          Add New Expense
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Expense Title */}
          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Expense Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Electricity Bill"
              className={inputClass}
              required
            />
          </div>

          {/* Category */}
          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
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

          {/* Amount */}
          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Amount (৳)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className={inputClass}
              required
            />
          </div>

          {/* Payment Method */}
          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={inputClass}
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write expense details..."
            rows={3}
            className={`${inputClass} resize-y`}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {saving ? "Saving..." : "Add Expense"}
        </button>
      </form>

      {/* Expense History */}
      <div className="min-w-0 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b p-4 sm:p-5">
          <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
            Expense History
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            View all recorded business expenses.
          </p>
        </div>

        {loading ? (
          <p className="p-5 text-sm text-slate-500">
            Loading expenses...
          </p>
        ) : expenses.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No expenses found.
          </p>
        ) : (
          <>
            <p className="px-4 pt-3 text-xs text-slate-400 sm:hidden">
              Swipe horizontally to view all columns →
            </p>

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="whitespace-nowrap p-3 sm:p-4">
                      Title
                    </th>
                    <th className="whitespace-nowrap p-3 sm:p-4">
                      Category
                    </th>
                    <th className="whitespace-nowrap p-3 sm:p-4">
                      Amount
                    </th>
                    <th className="whitespace-nowrap p-3 sm:p-4">
                      Payment
                    </th>
                    <th className="whitespace-nowrap p-3 sm:p-4">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-t transition hover:bg-slate-50"
                    >
                      <td className="max-w-[220px] truncate p-3 font-medium text-slate-800 sm:p-4">
                        {expense.title}
                      </td>

                      <td className="whitespace-nowrap p-3 text-slate-600 sm:p-4">
                        {expense.category}
                      </td>

                      <td className="whitespace-nowrap p-3 font-semibold text-red-600 sm:p-4">
                        ৳{Number(expense.amount).toLocaleString("en-BD")}
                      </td>

                      <td className="whitespace-nowrap p-3 text-slate-600 sm:p-4">
                        {expense.paymentMethod}
                      </td>

                      <td className="whitespace-nowrap p-3 text-slate-600 sm:p-4">
                        {new Date(expense.expenseDate).toLocaleDateString(
                          "en-GB"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
