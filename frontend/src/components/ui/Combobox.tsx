import { useState, useRef, useEffect, useMemo } from 'react';

interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}

export default function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  disabled = false,
  loading = false,
  emptyMessage = 'Sin resultados',
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o =>
      o.label.toLowerCase().includes(q) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(q))
    );
  }, [options, search]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [filtered]);

  useEffect(() => {
    if (!containerRef.current) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current!.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex, open]);

  const closeAndReset = () => {
    setOpen(false);
    setSearch('');
  };

  const selectOption = (optValue: string) => {
    onChange(optValue);
    closeAndReset();
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    if (!disabled) setOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (!open) setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(i => (i + 1) % filtered.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(i => (i - 1 + filtered.length) % filtered.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightIndex]) {
          selectOption(filtered[highlightIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeAndReset();
        break;
      case 'Tab':
        closeAndReset();
        break;
    }
  };

  const displayValue = open ? search : selectedOption
    ? `${selectedOption.label}${selectedOption.sublabel ? ` — ${selectedOption.sublabel}` : ''}`
    : '';
  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue.charAt(0).toUpperCase() + displayValue.slice(1).toLowerCase()}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400 transition-shadow"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-500" />
          </div>
        )}
        {!loading && !disabled && (
          <button
            type="button"
            onClick={() => open ? closeAndReset() : setOpen(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4 transition-transform" style={{ transform: open ? 'rotate(180deg)' : '' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
      {open && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-96 overflow-y-auto"
          role="listbox"
        >
          {loading ? (
            <li className="px-4 py-6 text-sm text-gray-400 text-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-primary-500 mx-auto mb-2" />
              Cargando sedes...
            </li>
          ) : filtered.length === 0 ? (
            <li className="px-4 py-6 text-sm text-gray-400 text-center">{emptyMessage}</li>
          ) : (
            filtered.map((opt, idx) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={idx === highlightIndex}
                onMouseDown={(e) => {e.preventDefault(); selectOption(opt.value); }}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`px-4 py-2.5 cursor-pointer transition-colors text-sm border-b border-gray-200  ${
                  idx === highlightIndex || opt.value === value
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${opt.value === value ? 'font-semibold' : ''}`}
              >
                <span >{opt.label.charAt(0).toUpperCase() + opt.label.slice(1).toLowerCase()}</span>
                {opt.sublabel && (
                  <span className="text-gray-400 ml-1.5 text-xs">({opt.sublabel})</span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
