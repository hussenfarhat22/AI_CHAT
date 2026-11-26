"use client";

import type { Invoice } from "@/lib/schemas";

function show(value: string | number | null): string {
  return value === null ? "(not found)" : String(value);
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function InvoiceResult({ data }: { data: Invoice }) {
  function downloadJson() {
    save(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      "invoice.json"
    );
  }

  async function downloadExcel() {
    const XLSX = await import("xlsx");
    const summary = XLSX.utils.aoa_to_sheet([
      ["Field", "Value"],
      ["Vendor", data.vendor],
      ["Invoice number", data.invoiceNumber],
      ["Date", data.date],
      ["Currency", data.currency],
      ["Subtotal", data.subtotal],
      ["Tax", data.tax],
      ["Total", data.total],
    ]);
    const items = XLSX.utils.json_to_sheet(
      data.items.map((i) => ({
        Description: i.description,
        Quantity: i.quantity,
        "Unit price": i.unitPrice,
        Total: i.total,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summary, "Invoice");
    XLSX.utils.book_append_sheet(workbook, items, "Items");
    XLSX.writeFile(workbook, "invoice.xlsx");
  }

  const fields: [string, string | number | null][] = [
    ["Vendor", data.vendor],
    ["Invoice number", data.invoiceNumber],
    ["Date", data.date],
    ["Currency", data.currency],
  ];

  return (
    <div className="my-2 max-w-lg rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-700">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {fields.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
            <dd>{show(value)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="py-1 pr-3">Item</th>
              <th className="py-1 pr-3">Qty</th>
              <th className="py-1 pr-3">Unit</th>
              <th className="py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-1 pr-3">{item.description}</td>
                <td className="py-1 pr-3">{show(item.quantity)}</td>
                <td className="py-1 pr-3">{show(item.unitPrice)}</td>
                <td className="py-1">{show(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-gray-500 dark:text-gray-400">Subtotal</dt>
        <dd>{show(data.subtotal)}</dd>
        <dt className="text-gray-500 dark:text-gray-400">Tax</dt>
        <dd>{show(data.tax)}</dd>
        <dt className="font-semibold">Total</dt>
        <dd className="font-semibold">{show(data.total)}</dd>
      </dl>

      <div className="mt-3 flex gap-2">
        <button
          onClick={downloadExcel}
          className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Download Excel
        </button>
        <button
          onClick={downloadJson}
          className="rounded-full border border-indigo-600 px-4 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50 dark:text-indigo-200 dark:hover:bg-indigo-950"
        >
          Download JSON
        </button>
      </div>
    </div>
  );
}