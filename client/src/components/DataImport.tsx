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
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          AI-Powered Data Import
        </CardTitle>
        <CardDescription>
          Paste raw data from Google Sheets, Excel, or any spreadsheet. AI will automatically
          detect dates, net worth, and cash values.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong> Just paste your data in any format. The AI will
            understand columns, dates, and amounts automatically. Examples: CSV, TSV, copied
            spreadsheet cells, or even sentences like "On Jan 1 2024 I had $50k net worth with $10k cash"
          </AlertDescription>
        </Alert>

        {/* Input Area */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Paste your data here:</label>
          <Textarea
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            placeholder={`Examples:

Date	Net Worth	Cash
1/1/2024	$50,000	$10,000
2/1/2024	$55,000	$12,000
3/1/2024	$58,000	$11,000

Or any other format - AI will figure it out!`}
            className="min-h-[200px] font-mono text-sm"
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
