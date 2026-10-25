import type { ReactNode } from "react";

export default function Modal({
  titulo,
  alCerrar,
  children,
}: {
  titulo: string;
  alCerrar: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-10 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="mt-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{titulo}</h2>
          <button onClick={alCerrar} className="text-2xl leading-none text-slate-500 hover:text-slate-800">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
