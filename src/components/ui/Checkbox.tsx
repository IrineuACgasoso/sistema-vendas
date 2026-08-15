"use client";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}

export default function Checkbox({ checked, onChange, ariaLabel }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={ariaLabel}
      className="w-5 h-5 accent-blue-600 cursor-pointer flex-shrink-0"
    />
  );
}
