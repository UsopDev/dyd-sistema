import type { ReactNode } from "react";

export default function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-3 block text-sm font-medium text-slate-700">
      {etiqueta}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}

export const estiloInput = "w-full rounded border border-slate-300 px-3 py-2";
