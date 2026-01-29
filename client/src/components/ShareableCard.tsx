import { useRef, useState, useCallback } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/hooks/use-user-profile';
import { getPercentileForAge } from '@/data/scf-data';
import { modelExpectedWealth, projectFutureWealth } from '@/models/wealth-model';
import { occupationLabels } from '@/data/bls-wage-data';

interface ShareableCardProps {
  currentNetWorth: number | null;
  profile: UserProfile | null;
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const formatCompact = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
};

export function ShareableCard({ currentNetWorth, profile }: ShareableCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Calculate stats for the card
  const stats = (() => {
    if (!profile || currentNetWorth === null) return null;

    const percentile = getPercentileForAge(currentNetWorth, profile.age);

    const wealthModel = modelExpectedWealth({
      currentAge: profile.age,
      startAge: profile.age - profile.yearsInWorkforce,
      occupation: profile.occupation,
      level: profile.level,
      metro: profile.metro,
      savingsRate: profile.savingsRate,
      currentNetWorth,
    });

    const delta = wealthModel.comparison?.delta ?? 0;
    const isAhead = wealthModel.comparison?.isAhead ?? false;

    // Project to age 50 or 15 years from now, whichever is greater
    const targetAge = Math.max(50, profile.age + 15);
    const projection = projectFutureWealth(
      {
        currentAge: profile.age,
        startAge: profile.age - profile.yearsInWorkforce,
        occupation: profile.occupation,
        level: profile.level,
        metro: profile.metro,
        savingsRate: profile.savingsRate,
        currentNetWorth,
      },
      targetAge
    );

    return {
      age: profile.age,
      yearsWorking: profile.yearsInWorkforce,
      industry: occupationLabels[profile.occupation] ?? profile.occupation,
      percentile,
      delta,
      isAhead,
      projectedNW: projection.expectedNetWorth,
      projectedAge: targetAge,
    };
  })();

  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stats) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 400;
    const height = 250;
    canvas.width = width * 2; // 2x for retina
    canvas.height = height * 2;
    ctx.scale(2, 2);

    // Background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Header line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '500 13px Inter, system-ui, sans-serif';
    ctx.fillText(`Age ${stats.age}  •  ${stats.yearsWorking} years in ${stats.industry}`, 24, 36);

    // Main percentile
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Inter, system-ui, sans-serif';
    ctx.fillText(getOrdinalSuffix(stats.percentile), 24, 100);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '500 16px Inter, system-ui, sans-serif';
    ctx.fillText('percentile net worth for age', 24, 125);

    // Delta
    const deltaColor = stats.isAhead ? '#34d399' : '#fbbf24';
    ctx.fillStyle = deltaColor;
    ctx.font = 'bold 20px Inter, system-ui, sans-serif';
    const deltaText = `${stats.isAhead ? '+' : ''}${formatCompact(stats.delta)} vs expected`;
    ctx.fillText(deltaText, 24, 165);

    // Trajectory
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '500 14px Inter, system-ui, sans-serif';
    ctx.fillText(
      `On track to ${formatCompact(stats.projectedNW)} by age ${stats.projectedAge}`,
      24,
      195
    );

    // Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '400 11px Inter, system-ui, sans-serif';
    ctx.fillText('Based on Fed SCF 2022 + BLS wage data', 24, 230);
  }, [stats]);

  const copyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    drawCard();

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (!blob) {
        throw new Error('Failed to create image');
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);

      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Image copied to clipboard',
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback: download the image
      const link = document.createElement('a');
      link.download = 'networth-stats.png';
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: 'Downloaded!',
        description: 'Image saved (clipboard not available)',
      });
    }
  };

  if (!stats) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share Stats
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Stats</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Preview Card */}
          <div
            className="rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              padding: '24px',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <p className="text-white/60 text-sm mb-4">
              Age {stats.age} • {stats.yearsWorking} years in {stats.industry}
            </p>
            <p className="text-white text-5xl font-bold mb-1">
              {getOrdinalSuffix(stats.percentile)}
            </p>
            <p className="text-white/70 text-base mb-4">
              percentile net worth for age
            </p>
            <p
              className={`text-xl font-bold mb-3 ${
                stats.isAhead ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {stats.isAhead ? '+' : ''}{formatCompact(stats.delta)} vs expected
            </p>
            <p className="text-white/60 text-sm mb-4">
              On track to {formatCompact(stats.projectedNW)} by age {stats.projectedAge}
            </p>
            <p className="text-white/30 text-xs">
              Based on Fed SCF 2022 + BLS wage data
            </p>
          </div>

          {/* Hidden canvas for actual image generation */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Copy button */}
          <Button onClick={copyToClipboard} className="w-full gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy as Image
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            No personal amounts included • Safe for Blind/Reddit
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
