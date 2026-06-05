interface FilterChip {
  key: string;
  label: string;
  active: boolean;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onToggle: (key: string) => void;
}

export default function FilterChips({ chips, onToggle }: FilterChipsProps) {
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={() => onToggle(chip.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            chip.active
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}