import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Bug } from 'lucide-react';
import { DEBUG_ENABLED } from '@/lib/debug-logger';

interface DebugPanelProps {
  entries: Array<{
    id: string;
    date: string;
    totalNetWorth: number;
    cash: number;
    investment?: number;
  }>;
  latestEntry: {
    date: string;
    totalNetWorth: number;
    cash: number;
  } | null;
  onClose?: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function DebugPanel({ entries, latestEntry, onClose }: DebugPanelProps) {
  if (!DEBUG_ENABLED) return null;

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Card className="border-destructive bg-destructive/5 fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Debug Panel
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div>
          <p className="font-semibold mb-1">Total Entries: {entries.length}</p>
          {sortedEntries.length > 0 && (
            <>
              <p className="text-muted-foreground">
                Date Range: {sortedEntries[0].date} to {sortedEntries[sortedEntries.length - 1].date}
              </p>
            </>
          )}
        </div>

        {latestEntry && (
          <div className="bg-background p-2 rounded border">
            <p className="font-semibold mb-1">Latest Entry (What You Should See)</p>
            <p className="text-muted-foreground">Date: {latestEntry.date}</p>
            <p className="text-muted-foreground">
              Net Worth: {formatCurrency(latestEntry.totalNetWorth)}
            </p>
            <p className="text-muted-foreground">
              Cash: {formatCurrency(latestEntry.cash)}
            </p>
          </div>
        )}

        {sortedEntries.length > 0 && (
          <div>
            <p className="font-semibold mb-1">First 3 Entries:</p>
            {sortedEntries.slice(0, 3).map((e, i) => (
              <p key={i} className="text-muted-foreground">
                {e.date}: {formatCurrency(e.totalNetWorth)}
              </p>
            ))}
          </div>
        )}

        {sortedEntries.length > 0 && (
          <div>
            <p className="font-semibold mb-1">Last 3 Entries:</p>
            {sortedEntries.slice(-3).map((e, i) => (
              <p key={i} className="text-muted-foreground">
                {e.date}: {formatCurrency(e.totalNetWorth)}
              </p>
            ))}
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-muted-foreground italic">
            Check browser console for detailed logs
          </p>
          <p className="text-muted-foreground text-[10px] mt-1">
            localStorage.setItem('debug', 'false') to disable
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
