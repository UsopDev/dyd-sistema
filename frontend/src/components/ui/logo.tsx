import { cn } from "@/lib/utils";

interface LogoProps {
  compact?: boolean;
  className?: string;
  invertido?: boolean;
}

export function Logo({ compact = false, className, invertido = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 text-[13px] font-extrabold tracking-tight text-white shadow-lg shadow-blue-600/25">
        DYD
      </div>
      {!compact && (
        <div className="leading-tight">
          <p
            className={cn(
              "text-sm font-bold tracking-tight",
              invertido ? "text-white" : "text-slate-900",
            )}
          >
            DYD Sistema
          </p>
          <p
            className={cn(
              "text-[11px]",
              invertido ? "text-blue-100/90" : "text-slate-500",
            )}
          >
            Mantenimiento industrial
          </p>
        </div>
      )}
    </div>
  );
}
