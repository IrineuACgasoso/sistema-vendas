"use client";

import { useCallback, useRef } from "react";
import type { KeyboardEvent } from "react";

/**
 * Controla uma cadeia de campos onde ENTER avança para o próximo.
 * Uso:
 *   const flow = useEnterFlow(["pagtNome", "cliente", "data", "vendaConsig", "valor"]);
 *   <input ref={flow.registerRef("pagtNome")} onKeyDown={flow.handleKeyDown("pagtNome")} />
 *   ...
 *   flow.onComplete(() => salvar()) // chamado quando ENTER é pressionado no último campo
 */
export function useEnterFlow(ordemCampos: string[]) {
  const refsMap = useRef<Map<string, HTMLElement | null>>(new Map());
  const onCompleteRef = useRef<(() => void) | null>(null);

  const registerRef = useCallback(
    (campo: string) => (el: HTMLElement | null) => {
      refsMap.current.set(campo, el);
    },
    []
  );

  const focarCampo = useCallback((campo: string) => {
    const el = refsMap.current.get(campo);
    if (el) {
      el.focus();
      if (el instanceof HTMLInputElement) {
        // Move cursor pro final, evita selecionar texto todo de forma confusa
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }
  }, []);

  const handleKeyDown = useCallback(
    (campoAtual: string) => (e: KeyboardEvent<HTMLElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();

      const indiceAtual = ordemCampos.indexOf(campoAtual);
      const proximoIndice = indiceAtual + 1;

      if (proximoIndice < ordemCampos.length) {
        focarCampo(ordemCampos[proximoIndice]);
      } else {
        // Último campo da cadeia -> dispara conclusão (ex: salvar)
        onCompleteRef.current?.();
      }
    },
    [ordemCampos, focarCampo]
  );

  const onComplete = useCallback((callback: () => void) => {
    onCompleteRef.current = callback;
  }, []);

  return { registerRef, handleKeyDown, focarCampo, onComplete };
}
