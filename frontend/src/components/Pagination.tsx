interface PaginationProps {
  pagina: number;
  total: number;
  limit: number;
  onChange: (pagina: number) => void;
}

export default function Pagination({ pagina, total, limit, onChange }: PaginationProps) {
  if (total === 0) return null;

  const desde = pagina * limit + 1;
  const hasta = Math.min((pagina + 1) * limit, total);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex items-center justify-between mt-4 bg-white rounded-xl px-5 py-3 border border-gray-100 shadow-sm">
      <button
        onClick={() => onChange(pagina - 1)}
        disabled={pagina === 0}
        className="py-2 px-4 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-orange-50 hover:border-primary-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Anterior
      </button>
      <span className="text-sm text-gray-600">
        Mostrando <span className="font-semibold text-gray-800">{desde}</span>-<span className="font-semibold text-gray-800">{hasta}</span> de <span className="font-semibold text-primary-600">{total}</span>
      </span>
      <button
        onClick={() => onChange(pagina + 1)}
        disabled={pagina >= totalPages - 1}
        className="py-2 px-4 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-orange-50 hover:border-primary-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
      >
        Siguiente
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}