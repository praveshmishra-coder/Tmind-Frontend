import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Papa from "papaparse";

export default function CsvUploadPreview() {
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setHeaders(Object.keys(result.data[0] || {}));
        setRows(result.data);
      },
    });
  };

  return (
    <div className="p-6 space-y-4">
      <Card className="shadow-lg rounded-2xl p-4">
        <CardContent className="space-y-4">
          <h2 className="text-xl font-semibold">Upload Device Import CSV</h2>
          <input type="file" accept=".csv" onChange={handleFile} />
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3">Preview Data</h3>
            <div className="overflow-auto max-h-[400px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h, i) => (
                      <TableHead key={i}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.map((h, cellIndex) => (
                        <TableCell key={cellIndex}>{row[h]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
