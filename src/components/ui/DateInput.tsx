"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { applyBrDateMask } from "@/lib/utils/date";

interface DateInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, error, value, onChange, className = "", ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          value={value}
          onChange={(e) => onChange(applyBrDateMask(e.target.value))}
          className={`border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? "border-red-500" : "border-gray-300"
          } ${className}`}
          {...rest}
        />
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }
);

DateInput.displayName = "DateInput";
export default DateInput;
