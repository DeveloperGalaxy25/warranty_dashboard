import { useState, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "../WarrantyDashboard";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

// Normalize a Date to start of day (00:00:00.000)
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Normalize a Date to end of day (23:59:59.999)
function endOfDay(d: Date): Date {
  const e = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  e.setHours(23, 59, 59, 999);
  return e;
}

const presetRanges = {
  "today": () => {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);
    return { from: start, to: end };
  },
  "yesterday": () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const start = startOfDay(yesterday);
    const end = endOfDay(yesterday);
    return { from: start, to: end };
  },
  // Inclusive presets (e.g., Last 7 days includes today and 6 previous full days)
  "7days": () => ({
    from: startOfDay(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)),
    to: endOfDay(new Date())
  }),
  "30days": () => ({
    from: startOfDay(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)),
    to: endOfDay(new Date())
  }),
  "90days": () => ({
    from: startOfDay(new Date(Date.now() - 89 * 24 * 60 * 60 * 1000)),
    to: endOfDay(new Date())
  }),
  "custom": () => null
};

export const DateRangePicker = ({ value, onChange }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [explicitCustomSelection, setExplicitCustomSelection] = useState(false);

  // Function to detect which preset matches the current date range
  const detectPreset = (range: DateRange): string => {
    const today = startOfDay(new Date());
    const from = startOfDay(range.from);
    const to = startOfDay(range.to);
    const days = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1; // inclusive

    // Check if it's yesterday first (before checking today-based ranges)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = startOfDay(yesterday); // Compare at same time level
    
    if (from.getTime() === yesterdayStart.getTime() && to.getTime() === yesterdayEnd.getTime()) {
      return "yesterday";
    }

    if (to.getTime() === today.getTime()) {
      if (days === 1) return "today";
      if (days === 7) return "7days";
      if (days === 30) return "30days";
      if (days === 90) return "90days";
    }

    return "custom";
  };

  const selectedPreset = explicitCustomSelection ? "custom" : detectPreset(value);

  // Sync customRange state with the current value
  useEffect(() => {
    setCustomRange(value);
  }, [value]);

  const handlePresetChange = (preset: string) => {
    if (preset !== "custom") {
      const range = presetRanges[preset as keyof typeof presetRanges]();
      if (range) {
        onChange(range);
        // Update customRange state to reflect the current range
        setCustomRange(range);
        setExplicitCustomSelection(false); // Reset custom selection
        setIsOpen(false);
      }
    } else {
      // When "custom" is selected, keep the popover open to show the calendar
      // Don't close the popover, just ensure customRange is set to current value
      setCustomRange(value);
      setExplicitCustomSelection(true); // Mark as explicit custom selection
    }
  };

  const handleCustomRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    // Do not call onChange here; only stage selection locally
    if (range?.from || range?.to) {
      setCustomRange({
        from: range.from ? startOfDay(range.from) : undefined,
        to: range.to ? endOfDay(range.to) : undefined,
      });
    } else {
      setCustomRange({});
    }
  };

  const formatDateRange = (range: DateRange) => {
    const today = startOfDay(new Date());
    const from = startOfDay(range.from);
    const to = startOfDay(range.to);
    const days = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1; // inclusive

    if (to.getTime() === today.getTime()) {
      if (days === 1) return "Today";
      if (days === 7) return "Last 7 days";
      if (days === 30) return "Last 30 days";
      if (days === 90) return "Last 90 days";
    }

    return `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center space-x-2 min-w-[200px] justify-between"
        >
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDateRange(value)}</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover border border-border shadow-lg z-50" align="end">
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Quick Select</label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg z-50">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedPreset === "custom" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Custom Date Range</label>
              <CalendarComponent
                mode="range"
                selected={(customRange.from || customRange.to) ? { from: customRange.from as Date | undefined, to: customRange.to as Date | undefined } : undefined}
                onSelect={handleCustomRangeSelect}
                numberOfMonths={1}
                className={cn("p-3 pointer-events-auto")}
              />
              <div className="flex justify-end gap-2 px-3 pb-3">
                <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (customRange.from && customRange.to) {
                      const normalized = { from: startOfDay(customRange.from), to: endOfDay(customRange.to) };
                      onChange(normalized as { from: Date; to: Date });
                      setExplicitCustomSelection(false);
                      setIsOpen(false);
                    }
                  }}
                  disabled={!customRange.from || !customRange.to}
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};