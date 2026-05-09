import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const map = {
  Active: "bg-success/15 text-success border-success/30",
  Completed: "bg-primary/15 text-primary border-primary/30",
  Pending: "bg-muted text-muted-foreground border-border",
  Delayed: "bg-destructive/15 text-destructive border-destructive/30",
  "In Progress": "bg-warning/20 text-warning-foreground border-warning/40",
  Submitted: "bg-accent text-accent-foreground border-accent",
  Approved: "bg-success/15 text-success border-success/30",
  High: "bg-destructive/15 text-destructive border-destructive/30",
  Medium: "bg-warning/20 text-warning-foreground border-warning/40",
  Low: "bg-muted text-muted-foreground border-border",
} as const;

export function StatusBadge({ status }: { status: keyof typeof map }) {
  return (
    <Badge variant="outline" className={cn("font-medium", map[status])}>
      {status}
    </Badge>
  );
}
