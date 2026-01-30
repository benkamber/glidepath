import { TrendingUp, Shield, BarChart3, Flame, Globe, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingPageProps {
  onGetStarted: () => void;
  onLoadDemo?: () => void;
}

const features = [
  {
    icon: BarChart3,
    title: 'Real Federal Reserve Data',
    description:
      'Percentile rankings from the 2022 Survey of Consumer Finances. Not some blog post, the actual Fed data.',
  },
  {
    icon: TrendingUp,
    title: 'Career-Aware Projections',
    description:
      'Models your wealth trajectory based on BLS wage data for your specific role, level, and metro area.',
  },
  {
    icon: Flame,
    title: 'Roast Mode',
    description:
      'Get brutally honest feedback on your numbers. Letter grades, contextual roasts, and actual action items.',
  },
  {
    icon: Globe,
    title: 'Geographic Arbitrage',
    description:
      'See how relocation affects your savings and FIRE timeline across 25+ metros.',
  },
  {
    icon: Share2,
    title: 'Shareable Stats Card',
    description:
      'Generate a privacy-safe image card showing your percentile. No dollar amounts. Safe for Blind/Reddit.',
  },
  {
    icon: Shield,
    title: '100% Private',
    description:
      'Everything runs in your browser. No accounts, no servers, no tracking. Your data never leaves your device.',
  },
];

export function LandingPage({ onGetStarted, onLoadDemo }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="space-y-6">
          <p className="text-sm font-medium text-primary tracking-wider uppercase">
            Glidepath
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Stop asking Blind.
            <br />
            <span className="text-muted-foreground">
              See where you actually rank.
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Free net worth percentile calculator using real Federal Reserve data.
            Compare against your age group, career profile, and metro area.
            Get honest feedback, not validation.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 pt-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button size="lg" onClick={onGetStarted} className="text-base px-8 py-6">
                Check Your Numbers
              </Button>
              {onLoadDemo && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onLoadDemo}
                  className="text-base px-8 py-6"
                >
                  👀 View Demo Profile
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              No signup. No tracking. 100% browser-local.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-semibold text-center mb-10">
          What you get
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="p-6 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
            >
              <feature.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Sources */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="rounded-lg border p-6 bg-card">
          <h3 className="font-semibold mb-4 text-center">Data sources we use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium">Federal Reserve SCF 2022</p>
              <p className="text-muted-foreground">
                Survey of Consumer Finances - the gold standard for household wealth
                data in the US. Percentiles by age group.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">BLS OES 2023</p>
              <p className="text-muted-foreground">
                Bureau of Labor Statistics Occupational Employment Statistics.
                Wage data by occupation, metro area, and experience level.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="rounded-lg border-2 border-primary/20 p-6 bg-primary/5 text-center">
          <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Your data stays yours</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            All calculations run entirely in your browser. No data is sent to any
            server. No accounts, no cookies, no analytics. Your financial data
            is stored only in your browser's localStorage and never leaves your
            device.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Ready to see where you stand?
        </h2>
        <Button size="lg" onClick={onGetStarted} className="text-base px-8 py-6">
          Check Your Numbers
        </Button>
      </div>

      {/* Footer */}
      <div className="border-t py-6 text-center text-xs text-muted-foreground">
        <p>
          Built for the Blind/Reddit crowd who want real data, not validation.
        </p>
        <p className="mt-1">
          Data: Federal Reserve SCF 2022 + BLS OES 2023
        </p>
      </div>
    </div>
  );
}
