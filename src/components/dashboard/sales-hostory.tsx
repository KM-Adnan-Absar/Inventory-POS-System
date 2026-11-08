"use client";

import { useEffect, useState } from "react";

type SaleItem = {
  id: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

type Sale = {
  id: number;
  invoiceNumber: string;
  subtotal: string;
  discount: string;
  total: string;
  paidAmount: string;
  changeAmount: string;
  paymentMethod: string;
  createdAt: string;
  cashier: {
    name: string;
    email: string;
  };
  items: SaleItem[];
};

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch("/api/sales");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch sales");
      }

      setSales(data.sales ?? []);
    } catch (error) {
      console.error("Sales history error:", error);
    } finally {
      setLoading(false);
    }
  };
const handlePrint = () => {
  window.print();
};
  return (
    <div className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Sales History
          </h2>
          <p className="text-sm text-slate-500">
            View your completed sales transactions.
          </p>
        </div>

        <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600">
          {sales.length} Sales
        </span>
      </div>

      {loading ? (
        <p className="py-8 text-center text-slate-500">
          Loading sales...
        </p>
      ) : sales.length === 0 ? (
        <p className="py-8 text-center text-slate-500">
          No sales found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Invoice</th>
                <th className="p-3">Date</th>
                <th className="p-3">Cashier</th>
                <th className="p-3">Items</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Total</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {sales.map((sale) => (
                <>
                  <tr key={sale.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium text-blue-600">
                      {sale.invoiceNumber}
                    </td>

                    <td className="p-3">
                      {new Date(sale.createdAt).toLocaleString()}
                    </td>

                    <td className="p-3">
                      {sale.cashier?.name ?? "Unknown"}
                    </td>

                    <td className="p-3">
                      {sale.items.reduce(
                        (total, item) => total + item.quantity,
                        0
                      )}
                    </td>

                    <td className="p-3">
                      <span className="rounded-md bg-slate-100 px-2 py-1">
                        {sale.paymentMethod}
                      </span>
                    </td>

                    <td className="p-3 font-semibold">
                      ৳{sale.total}
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() =>
                          setSelectedSale(
                            selectedSale === sale.id ? null : sale.id
                          )
                        }
                        className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                      >
                        {selectedSale === sale.id ? "Hide" : "Details"}
                      </button>
                    </td>
                  </tr>

                  {selectedSale === sale.id && (
                    <tr key={`${sale.id}-details`} className="bg-slate-50">
                   <td colSpan={7} className="invoice-print p-4">
                    <div className="mb-6 border-b-2 border-slate-800 pb-5">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-xl font-bold text-white">
        SP
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          StockPilot Store
        </h1>
        <p className="text-sm text-slate-500">
          Smart Inventory & POS Management
        </p>
      </div>
    </div>

    <div className="text-right text-sm text-slate-600">
      <p>Store Address: Your Store Address</p>
      <p>Phone: Your Phone Number</p>
      <p>Email: yourstore@email.com</p>
    </div>
  </div>
</div>

<div className="mb-5 flex items-start justify-between">
  <div>
    <h2 className="text-xl font-bold text-slate-800">
      SALES INVOICE
    </h2>
    <p className="mt-1 text-sm text-slate-500">
      Invoice: {sale.invoiceNumber}
    </p>
  </div>

  <div className="text-right text-sm">
    <p>
      <strong>Date:</strong>{" "}
      {new Date(sale.createdAt).toLocaleString()}
    </p>
    <p>
      <strong>Cashier:</strong>{" "}
      {sale.cashier?.name ?? "Unknown"}
    </p>
    <p>
      <strong>Payment:</strong> {sale.paymentMethod}
    </p>
  </div>
</div>
                        <h3 className="mb-3 font-semibold">
                          Invoice Details
                        </h3>

                        <div className="mb-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                          <p>Subtotal: ৳{sale.subtotal}</p>
                          <p>Discount: ৳{sale.discount}</p>
                          <p>Paid: ৳{sale.paidAmount}</p>
                          <p>Change: ৳{sale.changeAmount}</p>
                        </div>

<div className="mb-4 flex justify-end print:hidden">
  <button
    onClick={handlePrint}
    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
  >
    Print Invoice
  </button>
</div>

                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="p-2">Product</th>
                              <th className="p-2">SKU</th>
                              <th className="p-2">Quantity</th>
                              <th className="p-2">Price</th>
                              <th className="p-2">Total</th>
                            </tr>
                          </thead>

                          <tbody>
                            {sale.items.map((item) => (
                              <tr key={item.id} className="border-b">
                                <td className="p-2">
                                  {item.productName}
                                </td>
                                <td className="p-2">{item.sku}</td>
                                <td className="p-2">{item.quantity}</td>
                                <td className="p-2">৳{item.unitPrice}</td>
                                <td className="p-2">৳{item.lineTotal}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-6 border-t pt-4">
  <div className="ml-auto max-w-xs space-y-2 text-sm">
    <div className="flex justify-between">
      <span>Subtotal</span>
      <span>৳{sale.subtotal}</span>
    </div>

    <div className="flex justify-between">
      <span>Discount</span>
      <span>- ৳{sale.discount}</span>
    </div>

    <div className="flex justify-between border-t pt-3 text-lg font-bold">
      <span>Grand Total</span>
      <span>৳{sale.total}</span>
    </div>

    <div className="flex justify-between">
      <span>Paid Amount</span>
      <span>৳{sale.paidAmount}</span>
    </div>

    <div className="flex justify-between">
      <span>Change</span>
      <span>৳{sale.changeAmount}</span>
    </div>
  </div>

  <div className="mt-8 border-t pt-4 text-center">
    <p className="font-semibold text-slate-800">
      Thank You For Your Purchase!
    </p>
    <p className="mt-1 text-xs text-slate-500">
      Thank you for choosing StockPilot Store.
    </p>
  </div>
</div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}