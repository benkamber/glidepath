import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import {
  MethodologySection,
  ExternalLinkItem,
  CodeBlock,
  DefinitionList,
} from "@/components/MethodologySection";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function Methodology() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-primary">Methodology</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Data sources, calculations, and assumptions
            </p>
          </div>
        </div>

        {/* Last Updated Banner */}
        <Card className="border-primary/30 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Last Verified:</strong> January 2025 | All data sources have been cross-referenced and validated
            </p>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="terminal-card">
          <CardHeader>
            <CardTitle className="text-xl text-primary">How It Works</CardTitle>
            <CardDescription>
              This calculator uses publicly available data from the Federal Reserve and Bureau of Labor Statistics
              to provide personalized wealth projections. All calculations run 100% client-side in your browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={["data-sources"]} className="w-full">
              {/* Data Sources */}
              <MethodologySection title="Data Sources" defaultOpen>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">
                      Federal Reserve Survey of Consumer Finances (SCF) 2022
                    </h4>
                    <p className="mb-2">
                      The SCF is a triennial survey conducted by the Federal Reserve that provides the most comprehensive
                      data on American household wealth. We use this data to calculate net worth percentiles by age.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>
                        <ExternalLinkItem href="https://www.federalreserve.gov/econres/scf/dataviz/scf/chart/">
                          Interactive SCF Charts
                        </ExternalLinkItem>
                      </li>
                      <li>
                        <ExternalLinkItem href="https://www.federalreserve.gov/econres/scfindex.htm">
                          SCF Main Page
                        </ExternalLinkItem>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-2">
                      Bureau of Labor Statistics Occupational Employment and Wage Statistics (OES) 2023
                    </h4>
                    <p className="mb-2">
                      BLS OES provides comprehensive salary data by occupation and metropolitan area. We use this
                      for career progression modeling and geographic cost of living adjustments.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>
                        <ExternalLinkItem href="https://www.bls.gov/oes/current/oes_nat.htm">
                          National Occupational Employment and Wage Estimates
                        </ExternalLinkItem>
                      </li>
                      <li>
                        <ExternalLinkItem href="https://www.bls.gov/oes/current/oessrcma.htm">
                          Metropolitan Area Wage Data
                        </ExternalLinkItem>
                      </li>
                    </ul>
                  </div>

                  <div className="text-xs text-muted-foreground mt-4 p-3 bg-secondary/30 rounded">
                    <strong>Update Cadence:</strong> SCF data is published every 3 years (most recent: 2022). BLS OES data
                    is updated annually (most recent: May 2023). We update our data within 30 days of new releases.
                  </div>
                </div>
              </MethodologySection>

              {/* Calculation Methodologies */}
              <MethodologySection title="Calculation Methodologies">
                <div className="space-y-6">
                  {/* Net Worth Percentile */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Net Worth Percentile Calculation</h4>
                    <p className="mb-3">
                      We use linear interpolation between SCF data points to estimate your percentile ranking
                      within your age cohort.
                    </p>
                    <CodeBlock>
{`// Interpolation algorithm
function calculatePercentile(netWorth, age) {
  // Find age bracket from SCF data
  const bracket = findAgeBracket(age);

  // Sort percentile data points
  const sortedData = bracket.percentiles.sort();

  // Find surrounding percentiles
  for (let i = 0; i < sortedData.length - 1; i++) {
    if (netWorth >= sortedData[i].value &&
        netWorth < sortedData[i + 1].value) {
      // Linear interpolation
      const ratio = (netWorth - sortedData[i].value) /
                    (sortedData[i + 1].value - sortedData[i].value);
      return sortedData[i].percentile +
             ratio * (sortedData[i + 1].percentile -
                     sortedData[i].percentile);
    }
  }
}`}
                    </CodeBlock>
                  </div>

                  {/* Career Progression */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Career Progression Model</h4>
                    <p className="mb-3">
                      Based on your occupation and current level, we project salary growth using industry-standard
                      advancement timelines and BLS wage data.
                    </p>
                    <DefinitionList
                      items={[
                        {
                          term: "Level Advancement Logic",
                          definition: "Entry → Junior (2-3 years), Junior → Mid (2-3 years), Mid → Senior (3-4 years), Senior → Staff (4-5 years), Staff → Principal (5+ years)"
                        },
                        {
                          term: "Salary Multipliers",
                          definition: "Each level increase represents a 20-40% salary increase based on BLS data for the occupation"
                        },
                        {
                          term: "Geographic Adjustment",
                          definition: "Salaries are adjusted using BLS metropolitan area wage multipliers"
                        }
                      ]}
                    />
                  </div>

                  {/* Monte Carlo */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Monte Carlo Simulation</h4>
                    <p className="mb-3">
                      We run 1,000 simulations to model different market scenarios and calculate confidence intervals
                      for your wealth trajectory.
                    </p>
                    <CodeBlock>
{`// Monte Carlo parameters
const SIMULATIONS = 1000;
const MEAN_RETURN = 0.07;  // 7% real return
const VOLATILITY = 0.15;   // 15% standard deviation

// Run simulations
for (let i = 0; i < SIMULATIONS; i++) {
  let portfolio = initialNetWorth;
  for (let year = 0; year < yearsToTarget; year++) {
    // Random return from normal distribution
    const annualReturn = randomNormal(MEAN_RETURN, VOLATILITY);
    portfolio = portfolio * (1 + annualReturn) + annualSavings;
  }
  results.push(portfolio);
}

// Calculate percentiles (5th, 25th, 50th, 75th, 95th)
const percentiles = calculatePercentiles(results);`}
                    </CodeBlock>
                  </div>

                  {/* Linear Regression */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Linear Regression & Trendline</h4>
                    <p className="mb-3">
                      We calculate a best-fit line through your historical data points using ordinary least squares
                      regression and compute the R² coefficient to measure fit quality.
                    </p>
                    <CodeBlock>
{`// Linear regression calculation
function linearRegression(dataPoints) {
  const n = dataPoints.length;
  const sumX = sum(dataPoints.map(d => d.x));
  const sumY = sum(dataPoints.map(d => d.y));
  const sumXY = sum(dataPoints.map(d => d.x * d.y));
  const sumX2 = sum(dataPoints.map(d => d.x * d.x));

  // Calculate slope and intercept
  const slope = (n * sumXY - sumX * sumY) /
                (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R² (coefficient of determination)
  const meanY = sumY / n;
  const ssTotal = sum(dataPoints.map(d =>
    Math.pow(d.y - meanY, 2)));
  const ssResidual = sum(dataPoints.map(d =>
    Math.pow(d.y - (slope * d.x + intercept), 2)));
  const r2 = 1 - (ssResidual / ssTotal);

  return { slope, intercept, r2 };
}`}
                    </CodeBlock>
                  </div>
                </div>
              </MethodologySection>

              {/* Assumptions */}
              <MethodologySection title="Assumptions & Parameters">
                <div className="space-y-4">
                  <DefinitionList
                    items={[
                      {
                        term: "Investment Returns",
                        definition: "7% real annual return (inflation-adjusted) based on historical S&P 500 performance (1926-2024). Nominal returns are assumed to be ~10% with ~3% inflation."
                      },
                      {
                        term: "Tax Rates",
                        definition: "Federal tax: 24% effective rate for professional occupations. State taxes vary by metro area: 0% (TX, FL, WA), 5% (IL, MA), 9.3% (NY), 13.3% (CA)."
                      },
                      {
                        term: "Career Level Timing",
                        definition: "Years per level: Entry (0-2), Junior (2-3), Mid (3-4), Senior (4-5), Staff (5-7), Principal (7+). Based on industry surveys and career progression data."
                      },
                      {
                        term: "Cost of Living Adjustments",
                        definition: "Based on BLS metropolitan area price parities (RPPs) adjusted for housing, transportation, and goods/services. San Francisco baseline (1.0x), Austin (0.78x), Seattle (0.95x), NYC (0.98x), etc."
                      },
                      {
                        term: "Savings Rate",
                        definition: "Calculated as (Income - Expenses) / Income. We assume expenses based on your stated annual spending or use 50-70% of income as default for professional occupations."
                      }
                    ]}
                  />
                </div>
              </MethodologySection>

              {/* FIRE Definitions */}
              <MethodologySection title="FIRE Definitions">
                <div className="space-y-4">
                  <p>
                    FIRE (Financial Independence, Retire Early) thresholds are based on the "safe withdrawal rate"
                    principle and community-accepted definitions from r/financialindependence.
                  </p>

                  <DefinitionList
                    items={[
                      {
                        term: "Lean FIRE",
                        definition: "Annual expenses < $40,000. Portfolio target: 25x annual expenses using 4% safe withdrawal rate (SWR). Frugal lifestyle, typical portfolio: $600k-$1M."
                      },
                      {
                        term: "Coast FIRE",
                        definition: "Portfolio is large enough to grow to full FIRE by age 65 without additional contributions. Can stop saving and work part-time or take career breaks."
                      },
                      {
                        term: "Barista FIRE",
                        definition: "Portfolio covers most expenses, but part-time income ($15-30k/year) supplements withdrawals and provides health insurance. Lower SWR needed (~3%)."
                      },
                      {
                        term: "Regular FIRE",
                        definition: "Annual expenses $40-60k. Portfolio target: 25x annual expenses (4% SWR). Comfortable middle-class lifestyle, typical portfolio: $1M-$1.5M."
                      },
                      {
                        term: "Chubby FIRE",
                        definition: "Annual expenses $60-100k. Portfolio target: ~28x annual expenses using 3.5% SWR for added safety. Upper-middle-class lifestyle, typical portfolio: $1.8M-$3M."
                      },
                      {
                        term: "Fat FIRE",
                        definition: "Annual expenses $100k+. Portfolio target: 40x annual expenses using 2.5% SWR for maximum safety and legacy planning. Affluent lifestyle, typical portfolio: $4M+."
                      }
                    ]}
                  />

                  <div className="text-xs text-muted-foreground mt-4 p-3 bg-secondary/30 rounded">
                    <strong>Safe Withdrawal Rate (SWR):</strong> The 4% rule is based on the Trinity Study (1998) which
                    found that a 4% initial withdrawal rate, adjusted for inflation, has historically sustained a portfolio
                    for 30+ years with 95% success rate. We use more conservative rates (3.5%, 2.5%) for higher expense
                    levels to account for longer retirement periods and sequence of returns risk.
                  </div>
                </div>
              </MethodologySection>

              {/* Limitations */}
              <MethodologySection title="Limitations & Disclaimers">
                <div className="space-y-4">
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Not Financial Advice
                    </h4>
                    <p className="text-sm">
                      This tool is for educational and informational purposes only. It does not constitute financial,
                      investment, tax, or legal advice. Always consult with qualified professionals before making
                      financial decisions.
                    </p>
                  </div>

                  <DefinitionList
                    items={[
                      {
                        term: "Historical Data Limitations",
                        definition: "Past performance does not guarantee future results. The 7% real return assumption is based on 100 years of stock market data, but future returns may differ significantly."
                      },
                      {
                        term: "Individual Results Vary",
                        definition: "Your actual results depend on countless factors: market timing, investment choices, career trajectory, life events, tax situation, and more. Use these projections as rough guidelines, not guarantees."
                      },
                      {
                        term: "Simplified Tax Model",
                        definition: "We use simplified effective tax rates. Actual taxes depend on filing status, deductions, capital gains treatment, state residency, and tax law changes."
                      },
                      {
                        term: "Career Progression Assumptions",
                        definition: "Not everyone advances at the typical pace. Your career may accelerate (promotions, job changes) or plateau (layoffs, career changes). Adjust projections based on your specific situation."
                      },
                      {
                        term: "Monte Carlo Limitations",
                        definition: "Simulations assume normally distributed returns. Real markets have fat tails (extreme events are more common than normal distribution suggests) and serial correlation."
                      },
                      {
                        term: "Inflation Treatment",
                        definition: "All projections are in today's dollars (real returns). Actual nominal amounts will be higher due to inflation. We assume 3% average inflation."
                      }
                    ]}
                  />
                </div>
              </MethodologySection>

              {/* Privacy */}
              <MethodologySection title="Privacy & Data Storage">
                <div className="space-y-4">
                  <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                    <h4 className="font-semibold text-success mb-2">100% Client-Side Processing</h4>
                    <p className="text-sm">
                      All calculations run entirely in your browser. Your financial data never leaves your device.
                      No servers, no databases, no tracking.
                    </p>
                  </div>

                  <DefinitionList
                    items={[
                      {
                        term: "Local Storage Only",
                        definition: "Your data is stored in your browser's localStorage. It persists across sessions but only on this device/browser. Clear your browser data to delete all stored information."
                      },
                      {
                        term: "No Account Required",
                        definition: "No email, no password, no personal information collected. You can use this tool completely anonymously."
                      },
                      {
                        term: "No Analytics or Tracking",
                        definition: "We don't use Google Analytics, Facebook Pixel, or any third-party tracking. We don't know who you are or what numbers you enter."
                      },
                      {
                        term: "Open Source",
                        definition: "The code is transparent and auditable. You can inspect the source to verify that no data is sent to external servers."
                      }
                    ]}
                  />
                </div>
              </MethodologySection>
            </Accordion>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="flex justify-center pb-8">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Calculator
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
