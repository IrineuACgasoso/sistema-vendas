"use client";

import { forwardRef, useImperativeHandle, useRef, type InputHTMLAttributes } from "react";

interface DateInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "onKeyDown"> {
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Campo de data em três segmentos independentes (dia / mês / ano), em vez de
 * um único input com máscara reconstruída a cada tecla. Isso evita o bug de
 * "empurrar" o resto da data pra frente quando o usuário edita um dígito no
 * meio (ex: só o dia) — cada segmento só afeta a si mesmo.
 *
 * Mantém a mesma interface pública (value/onChange como string dd/mm/aaaa)
 * pra não exigir mudanças em nenhum outro componente que usa DateInput.
 */
const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, error, value, onChange, onKeyDown, className = "", ...rest }, ref) => {
    const [dia = "", mes = "", ano = ""] = value.split("/");

    const diaRef = useRef<HTMLInputElement>(null);
    const mesRef = useRef<HTMLInputElement>(null);
    const anoRef = useRef<HTMLInputElement>(null);

    // Expõe o segmento "dia" como o elemento focável do componente, pra
    // compatibilizar com useEnterFlow (que chama .focus() por fora).
    useImperativeHandle(ref, () => diaRef.current as HTMLInputElement);

    function montar(novoDia: string, novoMes: string, novoAno: string) {
      onChange(`${novoDia}/${novoMes}/${novoAno}`);
    }

    function handleSegmento(
      segmento: "dia" | "mes" | "ano",
      raw: string,
      maxLen: number,
      proximoRef: React.RefObject<HTMLInputElement> | null
    ) {
      const digits = raw.replace(/\D/g, "").slice(0, maxLen);
      if (segmento === "dia") montar(digits, mes, ano);
      if (segmento === "mes") montar(dia, digits, ano);
      if (segmento === "ano") montar(dia, mes, digits);

      if (digits.length === maxLen && proximoRef?.current) {
        proximoRef.current.focus();
        proximoRef.current.select();
      }
    }

    function handleBackspace(
      e: React.KeyboardEvent<HTMLInputElement>,
      segmento: "dia" | "mes" | "ano",
      atual: string,
      anteriorRef: React.RefObject<HTMLInputElement> | null
    ) {
      if (e.key === "Backspace" && atual === "" && anteriorRef?.current) {
        e.preventDefault();
        anteriorRef.current.focus();
        anteriorRef.current.select();
      }
    }

    const inputBase =
      "w-full text-center outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div
          className={`flex items-center gap-1 border rounded-md px-2 py-2 text-sm focus-within:ring-2 focus-within:ring-blue-500 ${
            error ? "border-red-500" : "border-gray-300"
          } ${className}`}
        >
          <input
            ref={diaRef}
            inputMode="numeric"
            placeholder="dd"
            value={dia}
            onChange={(e) => handleSegmento("dia", e.target.value, 2, mesRef)}
            onKeyDown={(e) => {
              handleBackspace(e, "dia", dia, null);
              onKeyDown?.(e);
            }}
            className={`${inputBase} w-6`}
            {...rest}
          />
          <span className="text-gray-400">/</span>
          <input
            ref={mesRef}
            inputMode="numeric"
            placeholder="mm"
            value={mes}
            onChange={(e) => handleSegmento("mes", e.target.value, 2, anoRef)}
            onKeyDown={(e) => {
              handleBackspace(e, "mes", mes, diaRef);
              onKeyDown?.(e);
            }}
            className={`${inputBase} w-6`}
          />
          <span className="text-gray-400">/</span>
          <input
            ref={anoRef}
            inputMode="numeric"
            placeholder="aaaa"
            value={ano}
            onChange={(e) => handleSegmento("ano", e.target.value, 4, null)}
            onKeyDown={(e) => {
              handleBackspace(e, "ano", ano, mesRef);
              onKeyDown?.(e);
            }}
            className={`${inputBase} w-10`}
          />
        </div>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }
);

DateInput.displayName = "DateInput";
export default DateInput;