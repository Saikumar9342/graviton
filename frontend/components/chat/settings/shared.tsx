import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Label
      className={cn(
        "text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-3 block",
        className,
      )}
    >
      {children}
    </Label>
  );
}

export function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="space-y-0.5">
        <p className="text-sm font-medium leading-none">{title}</p>
        {desc && <p className="text-xs text-muted-foreground/60">{desc}</p>}
      </div>
      {children}
    </div>
  );
}
