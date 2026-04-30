"use client";

import { useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type Column = {
  key: string;
  label: string;
};

type Props = {
  data: Record<string, unknown>[];
  filename: string;
  columns: Column[];
};

function escapeCSV(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function AdminExportButton({ data, filename, columns }: Props) {
  const handleExport = useCallback(() => {
    const header = columns.map((c) => escapeCSV(c.label)).join(",");
    const rows = data.map((row) =>
      columns.map((c) => escapeCSV(row[c.key])).join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data, filename, columns]);

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="mr-1.5 size-4" />
      Exporter CSV
    </Button>
  );
}
