import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseFlexibleDate } from "@/lib/date-parser";

interface ParsedEntry {
  date: string;
  totalNetWorth: number;
  cash: number;
  investment?: number;
  source: string;
}

interface SimpleDataImportProps {
  onImport: (entries: ParsedEntry[]) => void;
}

/**
 * Local Data Parser (No AI, No Costs)
 * Handles common formats: CSV, TSV, Excel copy-paste
 */
export function SimpleDataImport({ onImport }: SimpleDataImportProps) {
  const [rawData, setRawData] = useState("");
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const parseNumber = (str: string): number | null => {
    if (!str) return null;
    // Remove currency symbols, commas, spaces
    const cleaned = str.replace(/[$,€£¥\s]/g, "").trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const parseData = () => {
    if (!rawData.trim()) {
      setError("Please paste some data first");
      return;
    }

    setError(null);
    const entries: ParsedEntry[] = [];
    const lines = rawData.split("\n").filter(line => line.trim());

    // Detect delimiter (tab, comma, pipe, or multiple spaces)
    const firstLine = lines[0];
    let delimiter: string | RegExp = "\t";
    if (firstLine.includes("\t")) delimiter = "\t";
    else if (firstLine.includes(",")) delimiter = ",";
    else if (firstLine.includes("|")) delimiter = "|";
    else if (firstLine.match(/\s{2,}/)) delimiter = /\s{2,}/;

    // Check if first line is header
    const firstLineValues = typeof delimiter === "string"
      ? firstLine.split(delimiter)
      : firstLine.split(delimiter);
    const hasHeader = firstLineValues.some(val =>
      val.toLowerCase().includes("date") ||
      val.toLowerCase().includes("worth") ||
      val.toLowerCase().includes("cash")
    );

    const dataLines = hasHeader ? lines.slice(1) : lines;

    for (const line of dataLines) {
      try {
        const values = typeof delimiter === "string"
          ? line.split(delimiter).map(v => v.trim())
          : line.split(delimiter as RegExp).map(v => v.trim());

        if (values.length < 2) continue; // Need at least date and net worth

        // Try to find date, net worth, cash
        let date: string | null = null;
        let netWorth: number | null = null;
        let cash: number | null = null;
        let investment: number | null = null;

        // Strategy 1: First column is date
        const possibleDate = parseFlexibleDate(values[0]);
        if (possibleDate) {
          date = possibleDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD

          // Look for numbers in remaining columns
          const numbers = values.slice(1).map(parseNumber).filter(n => n !== null) as number[];

          if (numbers.length >= 2) {
            // Assume: first number = net worth, second = cash
            netWorth = numbers[0];
            cash = numbers[1];
            if (numbers.length >= 3) investment = numbers[2];
          } else if (numbers.length === 1) {
            // Only net worth provided
            netWorth = numbers[0];
            cash = 0;
          }
        } else {
          // Strategy 2: Try each column as date
          for (let i = 0; i < values.length; i++) {
            const testDate = parseFlexibleDate(values[i]);
            if (testDate) {
              date = testDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
              // Get numbers from other columns
              const otherValues = [...values.slice(0, i), ...values.slice(i + 1)];
              const numbers = otherValues.map(parseNumber).filter(n => n !== null) as number[];

              if (numbers.length >= 2) {
                netWorth = numbers[0];
                cash = numbers[1];
                if (numbers.length >= 3) investment = numbers[2];
              } else if (numbers.length === 1) {
                netWorth = numbers[0];
                cash = 0;
              }
              break;
            }
          }
        }

        // If we found valid data, add entry
        if (date && netWorth !== null && cash !== null) {
          entries.push({
            date,
            totalNetWorth: Math.round(netWorth),
            cash: Math.round(cash),
            investment: investment !== null ? Math.round(investment) : undefined,
            source: "imported",
          });
        }
      } catch (err) {
        console.warn("Failed to parse line:", line, err);
        // Continue with next line
      }
    }

    if (entries.length === 0) {
      setError(
        "Could not parse any entries. Make sure your data includes:\n" +
        "• Date (first column recommended)\n" +
        "• Net Worth (required)\n" +
        "• Cash (required)\n" +
        "• Investment (optional)\n\n" +
        "Supported formats: CSV, TSV, or copy-paste from Excel/Google Sheets"
      );
      return;
    }

    // Sort by date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setParsedEntries(entries);
    toast({
      title: "Data parsed successfully!",
      description: `Found ${entries.length} entries`,
    });
  };

  const handleImport = () => {
    if (parsedEntries.length === 0) {
      setError("No entries to import");
      return;
    }

    onImport(parsedEntries);
    toast({
      title: "Data imported!",
      description: `Successfully imported ${parsedEntries.length} entries`,
    });

    // Reset
    setRawData("");
    setParsedEntries([]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Upload className="h-6 w-6" />
          📊 Bulk Import: Paste Structured Data
        </CardTitle>
        <CardDescription className="text-base">
          <strong>Local parser - no AI, no costs.</strong> Paste data from spreadsheets (CSV, TSV, Excel, Google Sheets).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <Alert className="border-blue-500/50 bg-blue-500/5">
          <Info className="h-5 w-5 text-blue-500" />
          <AlertDescription className="text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-base">✨ Supported Formats</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>CSV:</strong> Date,Net Worth,Cash (or Date,Net Worth,Cash,Investment)</li>
                <li><strong>TSV:</strong> Date→Net Worth→Cash (tab-separated from Excel/Sheets)</li>
                <li><strong>Copy-paste:</strong> Select cells in Excel/Google Sheets and paste here</li>
                <li><strong>Headers:</strong> Optional - first row can be headers or data</li>
              </ul>
              <p className="text-xs italic pt-2 text-yellow-600">
                ⚠️ For complex/messy formats, use manual entry. This parser works best with structured data.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Input Area */}
        <div className="space-y-2">
          <label className="text-sm font-medium">📋 Paste your data (3+ columns: Date, Net Worth, Cash):</label>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            <strong>Two-step process:</strong> First parse to preview, then import to add to your tracker
          </p>
          <Textarea
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            placeholder={`Example formats that work:

CSV (comma-separated):
Date,Net Worth,Cash,Investment
1/1/2024,50000,10000,40000
2/1/2024,55000,12000,43000

TSV (tab-separated, from Excel):
Date	Net Worth	Cash
1/1/2024	50000	10000
2/1/2024	55000	12000

With headers:
date,total,liquid
2024-01-01,$50,000,$10,000
2024-02-01,$55,000,$12,000

Just paste and click Parse!`}
            className="min-h-[250px] font-mono text-sm"
          />
        </div>

        {/* Parse Button */}
        <Button
          onClick={parseData}
          disabled={!rawData.trim()}
          className="w-full"
          size="lg"
          variant="secondary"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Step 1: Parse & Preview Data
        </Button>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
          </Alert>
        )}

        {/* Preview Parsed Data */}
        {parsedEntries.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Parsed Data Preview
              </h3>
              <Badge variant="secondary">
                {parsedEntries.length} entries found
              </Badge>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Date</th>
                    <th className="text-right py-2 px-3 font-medium">Net Worth</th>
                    <th className="text-right py-2 px-3 font-medium">Cash</th>
                    <th className="text-right py-2 px-3 font-medium">Investment</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedEntries.slice(0, 10).map((entry, idx) => (
                    <tr key={idx} className="border-t hover:bg-muted/30">
                      <td className="py-2 px-3">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="text-right py-2 px-3 font-medium">
                        {formatCurrency(entry.totalNetWorth)}
                      </td>
                      <td className="text-right py-2 px-3">
                        {formatCurrency(entry.cash)}
                      </td>
                      <td className="text-right py-2 px-3 text-muted-foreground">
                        {formatCurrency(entry.investment || (entry.totalNetWorth - entry.cash))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parsedEntries.length > 10 && (
              <p className="text-xs text-muted-foreground text-center">
                Showing first 10 of {parsedEntries.length} entries
              </p>
            )}

            {/* Import Button */}
            <Button
              onClick={handleImport}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              ✓ Step 2: Add {parsedEntries.length} Entries to Tracker
            </Button>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p><strong>Parsing Logic:</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• Automatically detects delimiter (comma, tab, pipe, multiple spaces)</li>
            <li>• First row with "date", "worth", "cash" keywords = headers (skipped)</li>
            <li>• Dates: MM/DD/YYYY, YYYY-MM-DD, M/D/YY, "January 1, 2024", etc.</li>
            <li>• Numbers: Handles $, commas, spaces (e.g., "$50,000" → 50000)</li>
            <li>• If investment not provided: calculated as Net Worth - Cash</li>
            <li>• ⚠️ For messy data, consider entering manually (no AI parser = no flexible parsing)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
