"use client";

interface RadioOptionProps {
  label: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
}

export default function RadioOption({ label, name, value, checked, onChange }: RadioOptionProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="w-4 h-4 accent-blue-600"
      />
      <span className="text-sm font-medium text-gray-800">{label}</span>
    </label>
  );
}
