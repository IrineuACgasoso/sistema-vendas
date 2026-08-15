/**
 * Rate limiting em memória, por instância de servidor. Não é distribuído
 * (em serverless cada invocação pode ter memória própria), mas serve como
 * uma camada extra de fallback contra tentativas automatizadas rápidas.
 * Para produção com tráfego real, considerar Upstash Redis no futuro.
 */

interface TentativaInfo {
  contagem: number;
  primeiraTentativaEm: number;
  bloqueadoAte: number | null;
}

const JANELA_MS = 5 * 60 * 1000; // 5 minutos
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 15 * 60 * 1000; // 15 minutos

const tentativasPorChave = new Map<string, TentativaInfo>();

export interface RateLimitResultado {
  permitido: boolean;
  motivoBloqueio?: string;
}

export function verificarRateLimit(chave: string): RateLimitResultado {
  const agora = Date.now();
  const info = tentativasPorChave.get(chave);

  if (!info) return { permitido: true };

  if (info.bloqueadoAte && info.bloqueadoAte > agora) {
    const minutosRestantes = Math.ceil((info.bloqueadoAte - agora) / 60000);
    return {
      permitido: false,
      motivoBloqueio: `Muitas tentativas. Tente novamente em ${minutosRestantes} minuto(s).`,
    };
  }

  // Janela expirou, reseta
  if (agora - info.primeiraTentativaEm > JANELA_MS) {
    tentativasPorChave.delete(chave);
    return { permitido: true };
  }

  return { permitido: true };
}

export function registrarTentativaFalha(chave: string): void {
  const agora = Date.now();
  const info = tentativasPorChave.get(chave);

  if (!info || agora - info.primeiraTentativaEm > JANELA_MS) {
    tentativasPorChave.set(chave, {
      contagem: 1,
      primeiraTentativaEm: agora,
      bloqueadoAte: null,
    });
    return;
  }

  const novaContagem = info.contagem + 1;
  const bloqueadoAte = novaContagem >= MAX_TENTATIVAS ? agora + BLOQUEIO_MS : null;

  tentativasPorChave.set(chave, {
    contagem: novaContagem,
    primeiraTentativaEm: info.primeiraTentativaEm,
    bloqueadoAte,
  });
}

export function limparTentativas(chave: string): void {
  tentativasPorChave.delete(chave);
}
