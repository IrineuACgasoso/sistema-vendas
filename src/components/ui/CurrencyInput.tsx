"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { centavosToMaskedInput, digitsToCentavos } from "@/lib/utils/currency";

interface CurrencyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label?: string;
  error?: string;
  valueCentavos: number;
  onChangeCentavos: (centavos: number) => void;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, error, valueCentavos, onChangeCentavos, className = "", ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            R$
          </span>
          <input
            ref={ref}
            inputMode="numeric"
            placeholder="0,00"
            value={valueCentavos > 0 ? centavosToMaskedInput(valueCentavos) : ""}
            onChange={(e) => onChangeCentavos(digitsToCentavos(e.target.value))}
            className={`w-full border rounded-md pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? "border-red-500" : "border-gray-300"
            } ${className}`}
            {...rest}
          />
        </div>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
export default CurrencyInput;
