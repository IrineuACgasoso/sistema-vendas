"use client";

import { forwardRef, useEffect, useRef, useState, type KeyboardEvent } from "react";
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
    // Índice da sugestão destacada via teclado (-1 = nenhuma destacada)
    const [indiceDestacado, setIndiceDestacado] = useState(-1);
    const termoDebounced = useDebouncedValue(value, 250);
    const listaRef = useRef<HTMLUListElement>(null);

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

    // Sempre que a lista de sugestões muda (nova digitação), reseta o destaque
    useEffect(() => {
      setIndiceDestacado(-1);
    }, [sugestoes]);

    // Mantém o item destacado visível dentro da lista rolável
    useEffect(() => {
      if (indiceDestacado < 0) return;
      const item = listaRef.current?.children[indiceDestacado] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }, [indiceDestacado]);

    function handleSelecionar(nome: string) {
      onChange(nome);
      setMostrarSugestoes(false);
      setIndiceDestacado(-1);
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
          role="combobox"
          aria-expanded={mostrarSugestoes && sugestoes.length > 0}
          aria-autocomplete="list"
          aria-activedescendant={
            indiceDestacado >= 0 ? `sugestao-${sugestoes[indiceDestacado]?.id}` : undefined
          }
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
            const sugestoesVisiveis = mostrarSugestoes && sugestoes.length > 0;

            if (e.key === "ArrowDown") {
              if (!sugestoesVisiveis) return;
              e.preventDefault();
              setMostrarSugestoes(true);
              setIndiceDestacado((prev) => (prev + 1 >= sugestoes.length ? 0 : prev + 1));
              return;
            }

            if (e.key === "ArrowUp") {
              if (!sugestoesVisiveis) return;
              e.preventDefault();
              setIndiceDestacado((prev) => (prev - 1 < 0 ? sugestoes.length - 1 : prev - 1));
              return;
            }

            if (e.key === "Enter") {
              // Se alguma sugestão está destacada por teclado, Enter a seleciona
              // em vez de avançar o fluxo do formulário.
              if (sugestoesVisiveis && indiceDestacado >= 0) {
                e.preventDefault();
                handleSelecionar(sugestoes[indiceDestacado].nome);
                return;
              }
              onKeyDown?.(e);
              return;
            }

            if (e.key === "Escape") {
              setMostrarSugestoes(false);
              setIndiceDestacado(-1);
              return;
            }

            onKeyDown?.(e);
          }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />

        {mostrarSugestoes && (carregando || sugestoes.length > 0) && (
          <ul
            ref={listaRef}
            role="listbox"
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto"
          >
            {carregando && (
              <li className="px-3 py-2 text-xs text-gray-400">Buscando...</li>
            )}
            {!carregando &&
              sugestoes.map((pessoa, indice) => (
                <li
                  key={pessoa.id}
                  id={`sugestao-${pessoa.id}`}
                  role="option"
                  aria-selected={indice === indiceDestacado}
                  onMouseDown={() => handleSelecionar(pessoa.nome)}
                  onMouseEnter={() => setIndiceDestacado(indice)}
                  className={`px-3 py-2 text-sm cursor-pointer ${
                    indice === indiceDestacado ? "bg-blue-50" : "hover:bg-blue-50"
                  }`}
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
