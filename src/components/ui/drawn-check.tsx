import { cn } from "@/lib/utils";

export function DrawnCheck({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-accent", className)}
    >
      <path
        d="M5 13l4 4L19 7"
        pathLength={1}
        strokeDasharray={1}
        className="animate-draw-check"
      />
    </svg>
  );
}
