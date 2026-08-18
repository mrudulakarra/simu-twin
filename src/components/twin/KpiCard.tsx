import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export function KpiCard({
  label,
  value,
  unit,
  delta,
  explain,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  explain: string;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "success" | "warning" | "destructive";
}) {
  const toneClass = {
    primary: "text-primary",
    accent: "text-accent",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  }[tone];

  return (
    <Card className="glass-panel relative gap-0 overflow-hidden rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className={cn("size-4", toneClass)} />
          <span>{label}</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger aria-label={`What ${label} means`}>
              <Info className="size-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px]">{explain}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
      {delta && <p className={cn("mt-1 text-xs", toneClass)}>{delta}</p>}
    </Card>
  );
}