import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExternalLink, Database, BarChart3 } from "lucide-react";

/**
 * Data Sources and Methodology
 * Displays links to Federal Reserve SCF 2022 and BLS OES 2023 data
 */
export function DataSources() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Sources & Methodology
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {/* Federal Reserve SCF 2022 */}
          <AccordionItem value="scf">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="font-semibold">Federal Reserve SCF 2022</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Survey of Consumer Finances - Comprehensive wealth and income data for U.S. households
              </p>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Percentile Data by Demographics:</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• <strong>National:</strong> All U.S. households by age bracket</li>
                  <li>• <strong>Age Brackets:</strong> Under 25, 25-29, 30-34, 35-39, 40-44, 45-49, 50-54, 55-59, 60-64, 65-69, 70-74, 75+</li>
                  <li>• <strong>Percentiles:</strong> 10th, 25th, 50th (median), 75th, 90th, 95th, 99th</li>
                  <li>• <strong>Education:</strong> No HS, HS Diploma, Some College, Bachelor's, Graduate</li>
                </ul>
              </div>

              <div className="pt-2 border-t">
                <a
                  href="https://www.federalreserve.gov/econres/scfindex.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  View SCF 2022 Data
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Sample Size:</strong> ~6,500 families</p>
                <p><strong>Conducted:</strong> February 2022 - January 2023</p>
                <p><strong>Sponsored by:</strong> Federal Reserve Board (with Treasury Department)</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* BLS OES 2023 */}
          <AccordionItem value="bls">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="font-semibold">BLS OES 2023 Wage Data</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Occupational Employment and Wage Statistics - Comprehensive wage data by occupation and location
              </p>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Geographic Breakdowns:</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• <strong>National:</strong> United States average wages</li>
                  <li>• <strong>Metro Areas:</strong> 50+ major metropolitan statistical areas</li>
                  <li>• <strong>Regions:</strong> Northeast, South, Midwest, West</li>
                  <li>• <strong>States:</strong> All 50 states + DC</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Occupational Categories:</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Software Development & Engineering</li>
                  <li>• Data Science & Analytics</li>
                  <li>• Product & Project Management</li>
                  <li>• Finance & Accounting</li>
                  <li>• Marketing & Sales</li>
                  <li>• Healthcare & Medical</li>
                  <li>• Legal & Consulting</li>
                  <li>• Engineering (Non-Software)</li>
                  <li>• Education & Research</li>
                </ul>
              </div>

              <div className="pt-2 border-t">
                <a
                  href="https://www.bls.gov/oes/current/oes_nat.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  View BLS OES 2023 Data
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Sample Size:</strong> ~1.1 million establishments</p>
                <p><strong>Data Period:</strong> May 2023</p>
                <p><strong>Published by:</strong> U.S. Bureau of Labor Statistics</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Methodology */}
          <AccordionItem value="methodology">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <span className="font-semibold">Calculation Methodology</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Income Estimation:</h4>
                <p className="text-muted-foreground">
                  Base salary from BLS OES 2023 data for occupation, adjusted by:
                </p>
                <ul className="ml-4 space-y-1 text-muted-foreground">
                  <li>• Metro area wage multiplier (1.0x - 2.3x for high-cost cities)</li>
                  <li>• Career level (Entry, Mid, Senior, Staff, Principal)</li>
                  <li>• Years of experience within level</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Savings Rate Inference:</h4>
                <p className="text-muted-foreground">
                  Calculated from historical data using formula:
                </p>
                <div className="bg-muted/50 p-2 rounded font-mono text-xs">
                  savingsRate = (actualGrowth - investmentGrowth) / totalIncome
                </div>
                <p className="text-muted-foreground">
                  Defaults to 25% if insufficient data. Clamped to 0-90% range.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Wealth Projections:</h4>
                <ul className="ml-4 space-y-1 text-muted-foreground">
                  <li>• 7% real annual return (default, adjustable)</li>
                  <li>• Career progression based on BLS wage curves</li>
                  <li>• Cost of living adjustments for metro areas</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Peer Comparison:</h4>
                <p className="text-muted-foreground">
                  Your net worth is compared against SCF 2022 percentile bands for your age bracket.
                  Percentiles represent what percentage of U.S. households you're ahead of.
                </p>
              </div>

              <div className="pt-2 border-t">
                <h4 className="font-medium text-amber-600 dark:text-amber-400">Limitations:</h4>
                <ul className="ml-4 space-y-1 text-xs text-muted-foreground">
                  <li>• Tax calculations simplified (effective rates, not marginal)</li>
                  <li>• Doesn't account for: inheritance, equity vesting schedules, one-time events</li>
                  <li>• Historical returns don't guarantee future performance</li>
                  <li>• Regional data limited to major metro areas</li>
                  <li>• Wage data lags actual market conditions by 6-12 months</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-4 pt-4 border-t text-xs text-center text-muted-foreground">
          All calculations use publicly available federal data sources. No proprietary algorithms or hidden assumptions.
        </div>
      </CardContent>
    </Card>
  );
}
