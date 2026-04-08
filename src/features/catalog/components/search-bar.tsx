"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Buscar produto, marca ou categoria"
}: SearchBarProps) {
  return (
    <div className="grid gap-2 text-sm text-neutral-600">
      <span>Buscar produto</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit?.();
          }
        }}
        type="search"
        placeholder={placeholder}
        className="rounded-xl border border-black/10 px-3 py-2 outline-none transition focus:border-coral/40"
      />
    </div>
  );
}
