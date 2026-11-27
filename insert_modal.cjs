const fs = require('fs');
let content = fs.readFileSync('frontend/src/features/admin/reportes-page.tsx', 'utf8');

const lines = content.split('\n');

const modalLines = [
  '      {vistaPreviaAbierta && (',
  '        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setVistaPreviaAbierta(false)}>',
  '          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>',
  '            <div className="flex items-center justify-between p-4 border-b border-slate-200">',
  '              <h2 className="text-lg font-bold text-slate-900">Vista previa de impresión</h2>',
  '              <div className="flex items-center gap-2">',
  '                <Button variant="outline" size="sm" onClick={() => window.print()}>',
  '                  <Printer className="h-4 w-4" />',
  '                  Imprimir',
  '                </Button>',
  '                <Button variant="ghost" size="icon" onClick={() => setVistaPreviaAbierta(false)} aria-label="Cerrar">',
  '                  <X className="h-4 w-4" />',
  '                </Button>',
  '              </div>',
  '            </div>',
  '            <div className="h-[70vh] overflow-auto p-4">',
  '              <iframe',
  '                src={"/api/reportes/exportar/" + tipoExport + "?fecha_desde=" + (rango.desde ?? "") + "&fecha_hasta=" + (rango.hasta ?? "") + "&format=pdf"}',
  '                className="w-full h-full border-0"',
  '                title="Vista previa del reporte"',
  '              />',
  '            </div>',
  '          </div>',
  '        </div>',
  '      )}',
];

const newLines = [
  ...lines.slice(0, 794),
  ...modalLines,
  ...lines.slice(794)
];

fs.writeFileSync('frontend/src/features/admin/reportes-page.tsx', newLines.join('\n'));
console.log('Modal inserted at correct position');
