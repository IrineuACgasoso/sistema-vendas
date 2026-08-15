"use client";

import { forwardRef, useEffect, useState, type KeyboardEvent } from "react";
import { buscarPessoasPorPrefixo } from "@/app/actions/pessoas.actions";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Pessoa } from "@/types";

interface NomeAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
}

const NomeAutocomplete = forwardRef<HTMLInputElement, NomeAutocompleteProps>(
  ({ label, value, onChange, onKeyDown, required, placeholder }, ref) => {
    const [sugestoes, setSugestoes] = useState<Pessoa[]>([]);
    const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const termoDebounced = useDebouncedValue(value, 250);

    useEffect(() => {
      let cancelado = false;

      async function buscar() {
        const termo = termoDebounced.trim();
        if (termo.length < 1) {
          setSugestoes([]);
          return;
        }
        setCarregando(true);
        const resultado = await buscarPessoasPorPrefixo(termo);
        if (!cancelado) {
          setCarregando(false);
          if (resultado.ok && resultado.data) {
            setSugestoes(resultado.data);
          } else {
            setSugestoes([]);
          }
        }
      }

      buscar();
      return () => {
        cancelado = true;
      };
    }, [termoDebounced]);

    function handleSelecionar(nome: string) {
      onChange(nome);
      setMostrarSugestoes(false);
    }

    return (
      <div className="relative flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          {label}
        </label>
        <input
          ref={ref}
          type="text"
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setMostrarSugestoes(true);
          }}
          onFocus={() => setMostrarSugestoes(true)}
          onBlur={() => {
            // Delay para permitir clique na sugestão antes de fechar
            setTimeout(() => setMostrarSugestoes(false), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setMostrarSugestoes(false);
              return;
            }
            onKeyDown?.(e);
          }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />

        {mostrarSugestoes && (carregando || sugestoes.length > 0) && (
          <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
            {carregando && (
              <li className="px-3 py-2 text-xs text-gray-400">Buscando...</li>
            )}
            {!carregando &&
              sugestoes.map((pessoa) => (
                <li
                  key={pessoa.id}
                  onMouseDown={() => handleSelecionar(pessoa.nome)}
                  className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                >
                  {pessoa.nome}
                </li>
              ))}
          </ul>
        )}
      </div>
    );
  }
);

NomeAutocomplete.displayName = "NomeAutocomplete";
export default NomeAutocomplete;
