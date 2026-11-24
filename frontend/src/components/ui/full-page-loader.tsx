import { Loader2 } from "lucide-react";

export function FullPageLoader({ label = "Cargando sistema..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-5 py-4 shadow-glass backdrop-blur-xl">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
    </div>
  );
}
