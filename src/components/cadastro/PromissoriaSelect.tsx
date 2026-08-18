"use client";

interface PromissoriaSelectProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function PromissoriaSelect({ value, onChange }: PromissoriaSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        Promissória
      </label>
      <select
        value={value ? "sim" : "nao"}
        onChange={(e) => onChange(e.target.value === "sim")}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="nao">Padrão</option>
        <option value="sim">Promissória</option>
      </select>
    </div>
  );
}