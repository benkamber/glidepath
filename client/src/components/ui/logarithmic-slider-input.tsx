import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface LogarithmicSliderInputProps {
  id: string;
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  description?: string;
  icon?: string;
  required?: boolean;
  tooltip?: React.ReactNode; // Optional tooltip content
}

/**
 * Converts a linear slider position (0-100) to a logarithmic value
 */
function linearToLog(linear: number, min: number, max: number): number {
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const logValue = logMin + (linear / 100) * (logMax - logMin);
  return Math.round(Math.pow(10, logValue));
}

/**
 * Converts a logarithmic value to a linear slider position (0-100)
 */
function logToLinear(value: number, min: number, max: number): number {
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const logValue = Math.log10(value);
  return ((logValue - logMin) / (logMax - logMin)) * 100;
}

/**
 * Formats a number with comma separators
 */
function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Parses a comma-formatted string to a number
 */
function parseFormattedNumber(value: string): number {
  return parseFloat(value.replace(/,/g, ''));
}

export function LogarithmicSliderInput({
  id,
  label,
  value,
  onChange,
  min = 100,
  max = 20000000, // $20M
  placeholder,
  description,
  icon,
  required = false,
  tooltip,
}: LogarithmicSliderInputProps) {
  // Local state for input field (string with commas)
  const [inputValue, setInputValue] = useState<string>(
    value !== undefined ? formatNumber(value) : ''
  );

  // Linear slider position (0-100)
  const [sliderPosition, setSliderPosition] = useState<number>(
    value !== undefined ? logToLinear(value, min, max) : logToLinear((min + max) / 2, min, max)
  );

  // Sync input value when external value changes
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(formatNumber(value));
      setSliderPosition(logToLinear(value, min, max));
    } else {
      setInputValue('');
    }
  }, [value, min, max]);

  const handleSliderChange = (values: number[]) => {
    const newPosition = values[0];
    setSliderPosition(newPosition);

    const newValue = linearToLog(newPosition, min, max);
    setInputValue(formatNumber(newValue));
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);

    // Try to parse the value
    const numericValue = parseFormattedNumber(rawValue);

    if (!rawValue || rawValue === '') {
      onChange(undefined);
    } else if (!isNaN(numericValue) && numericValue >= min && numericValue <= max) {
      setSliderPosition(logToLinear(numericValue, min, max));
      onChange(numericValue);
    }
  };

  const handleInputBlur = () => {
    // Reformat on blur
    if (value !== undefined) {
      setInputValue(formatNumber(value));
    }
  };

  // Generate tick marks for logarithmic scale
  const tickMarks = [
    { position: logToLinear(100, min, max), label: '$100' },
    { position: logToLinear(1000, min, max), label: '$1K' },
    { position: logToLinear(10000, min, max), label: '$10K' },
    { position: logToLinear(100000, min, max), label: '$100K' },
    { position: logToLinear(1000000, min, max), label: '$1M' },
    { position: logToLinear(10000000, min, max), label: '$10M' },
  ].filter(tick => tick.position >= 0 && tick.position <= 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {label}
          {required && <span className="text-destructive">*</span>}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </Label>
        <div className="relative w-32">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            $
          </span>
          <Input
            id={id}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className="pl-7 h-9 text-sm"
          />
        </div>
      </div>

      <div className="relative">
        <Slider
          value={[sliderPosition]}
          onValueChange={handleSliderChange}
          min={0}
          max={100}
          step={0.1}
          className="w-full"
        />

        {/* Tick marks */}
        <div className="relative h-4 mt-1">
          {tickMarks.map((tick, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2"
              style={{ left: `${tick.position}%` }}
            >
              <div className="w-px h-2 bg-muted-foreground/30" />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {tick.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}
