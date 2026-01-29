import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ParsedEntry {
  date: string;
  totalNetWorth: number;
  cash: number;
  investment?: number;
  source: string;
}

interface DataImportProps {
  onImport: (entries: ParsedEntry[]) => void;
}

/**
 * AI-Powered Data Import Component
 * Allows users to paste raw spreadsheet data from Google Sheets, Excel, etc.
 * Uses Claude AI to intelligently parse any format and extract financial data
 */
export function DataImport({ onImport }: DataImportProps) {
  const [rawData, setRawData] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const parseWithAI = async () => {
    if (!rawData.trim()) {
      setError("Please paste some data first");
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/parse-financial-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawData }),
      });

      if (!response.ok) {
        throw new Error("Failed to parse data");
      }

      const result = await response.json();

      if (result.entries && result.entries.length > 0) {
        setParsedEntries(result.entries);
        toast({
          title: "Data parsed successfully!",
          description: `Found ${result.entries.length} entries`,
        });
      } else {
        setError("No financial data could be extracted. Please check your input.");
      }
    } catch (err) {
      setError("Failed to parse data. Please try again or format your data differently.");
      console.error("Parse error:", err);
    } finally {
      setIsParsing(false);
    }
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
          🚀 Bulk Import: Dump ALL Your Historical Data Here
        </CardTitle>
        <CardDescription className="text-base">
          <strong>Paste MESSY, RAW data from anywhere:</strong> Google Sheets, Excel, Mint, Personal Capital,
          bank statements, text files, or just copy-paste cells. AI parses ANY format automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <Alert className="border-primary/50 bg-primary/5">
          <Sparkles className="h-5 w-5 text-primary" />
          <AlertDescription className="text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-base">✨ AI reads ANY format - no cleanup needed!</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Copy-paste directly from Google Sheets, Excel, Mint, Personal Capital</li>
                <li>Drag-select cells and paste (tabs, commas, spaces - all work)</li>
                <li>Text files from your notes app</li>
                <li>Even sentences: "Jan 2024: $50k net worth, $10k liquid"</li>
                <li>Mixed formats, missing columns, typos - AI figures it out</li>
              </ul>
              <p className="text-xs italic pt-2">💡 Pro tip: Paste years of data at once instead of entering manually!</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Input Area */}
        <div className="space-y-2">
          <label className="text-sm font-medium">📋 Paste ALL your historical tracking data (years of data accepted):</label>
          <Textarea
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            placeholder={`Paste ANYTHING - AI will parse it! Examples:

From spreadsheet (with tabs):
Date	Net Worth	Cash	Investments
1/1/2023	$50,000	$10,000	$35,000
2/1/2023	$55,000	$12,000	$38,000

From text file:
Jan 2023: NW $50k, liquid $10k
Feb 2023: NW $55k, liquid $12k

From Mint export (CSV):
date,net_worth,cash
01/01/2023,50000,10000

Messy format:
2023-01-01 | Total: $50,000 (Cash: $10k)
2/1/23 - Worth: 55000, Checking: 12000

AI understands ALL formats - just paste and click Parse!`}
            className="min-h-[250px] font-mono text-sm"
            disabled={isParsing}
          />
        </div>

        {/* Parse Button */}
        <Button
          onClick={parseWithAI}
          disabled={isParsing || !rawData.trim()}
          className="w-full"
          size="lg"
        >
          {isParsing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Parsing with AI...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Parse Data with AI
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
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
            <Button onClick={handleImport} className="w-full" size="lg">
              <CheckCircle className="mr-2 h-4 w-4" />
              Import {parsedEntries.length} Entries
            </Button>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p><strong>Tips:</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• Works with any date format (MM/DD/YYYY, YYYY-MM-DD, "January 1, 2024", etc.)</li>
            <li>• Handles currency symbols ($, €, £), commas, and various number formats</li>
            <li>• Can parse TSV, CSV, or space-separated data</li>
            <li>• If investment amount isn't specified, it's calculated as: Net Worth - Cash</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
