sistema-vendas/
├── .env.local                      (nunca commitado)
├── .env.example                    (commitado, sem valores reais)
├── middleware.ts                   (protege NAVEGAÇÃO de páginas; server actions
│                                      se autoprotegem via exigirSessao(), ver abaixo)
├── firebase.json
├── firestore.indexes.json          → índices compostos usados pelas queries de vendas
├── firestore.rules
├── scripts/
│   ├── gerar-hash-senha.ts         → gera o hash de senha para o .env (npm run gerar-hash-senha)
│   ├── limpar-dados-teste.ts       → apaga TODAS as coleções pessoas/vendas, com confirmação (npm run limpar-dados-teste)
│   └── abrir-preview.html          → utilitário local (fora do build): abre a URL do deploy numa janela pop-up
├── public/
│   └── manifest.json               → permite "instalar" o sistema como app (display: standalone)
├── src/
│   ├── app/
│   │   ├── layout.tsx              → linka o manifest.json
│   │   ├── globals.css
│   │   ├── page.tsx                → redireciona / conforme sessão
│   │   ├── login/
│   │   │   └── page.tsx            → só renderiza <LoginForm />
│   │   ├── menu/
│   │   │   └── page.tsx            → só renderiza <MenuSelector />
│   │   ├── cadastro/
│   │   │   └── page.tsx            → renderiza <CadastroForm />
│   │   ├── vendas/
│   │   │   └── page.tsx            → renderiza <VendasContainer /> (mostra vendas abertas E fechadas)
│   │   ├── baixa/
│   │   │   └── page.tsx            → renderiza <BaixaContainer /> (mostra só vendas fechadas)
│   │   └── actions/                (Server Actions, isoladas por domínio)
│   │       ├── auth.actions.ts     → login(), logout(), confirmarSenhaAtual()
│   │       ├── pessoas.actions.ts  → buscarPessoasPorPrefixo(), salvarPessoaSeNova()
│   │       ├── vendas.actions.ts   → criarVenda(), listarVendas(), fecharVendas(),
│   │       │                          adicionarNumeroVenda(), darBaixa()
│   │
│   ├── components/
│   │   ├── ui/                     (componentes burros, reutilizáveis, sem lógica de negócio)
│   │   │   ├── Button.tsx
│   │   │   ├── TextInput.tsx
│   │   │   ├── DateInput.tsx       → máscara dd/mm/aaaa
│   │   │   ├── CurrencyInput.tsx   → máscara R$
│   │   │   ├── RadioOption.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── BackToMenuButton.tsx
│   │   │
│   │   ├── login/
│   │   │   └── LoginForm.tsx
│   │   │
│   │   ├── menu/
│   │   │   └── MenuSelector.tsx
│   │   │
│   │   ├── cadastro/
│   │   │   ├── CadastroForm.tsx        → orquestra o formulário (Promissória empilhada
│   │   │   │                              acima do grupo Pix/Depósito/Transf., ambos centralizados)
│   │   │   ├── TipoPagamentoRadio.tsx  → Pix/Depósito/Transferência
│   │   │   ├── PromissoriaSelect.tsx   → select "Padrão"/"Promissória", independente do tipo de pagamento
│   │   │   └── NomeAutocomplete.tsx    → reaproveitado p/ Pagt. e Cliente; navegação por
│   │   │                                  setas do teclado nas sugestões (sem precisar de mouse)
│   │   │
│   │   ├── vendas/                 (tela "Vendas": vê tudo — abertas e fechadas)
│   │   │   ├── VendasContainer.tsx        → orquestra estado geral da tela
│   │   │   ├── VendasPorDataVenda.tsx     → agrupa por data (ou lista plana quando ordenado por número)
│   │   │   ├── VendaLinhaVenda.tsx        → uma linha de venda em CSS Grid (colunas fixas,
│   │   │   │                                 exporta gridTemplateVendas() usado também no header)
│   │   │   ├── VendaLinhaVendaHeader.tsx  → cabeçalho de colunas (Nº/Valor/Pagante/Cliente/Forma/Status)
│   │   │   ├── BarraFecharCaixa.tsx / BarraFecharSelecionados.tsx → ação de fechar vendas selecionadas
│   │   │   └── AdicionarNumeroModal.tsx   → preencher vendaConsig depois (com trava de número duplicado)
│   │   │
│   │   └── baixa/                  (tela "Baixa": vê só vendas fechada === true)
│   │       ├── BaixaContainer.tsx      → orquestra estado geral da tela
│   │       ├── FiltrosBaixa.tsx        → data, nome, tipo, promissória (Todas/Só promissórias/
│   │       │                              Só não-promissórias) e ordenação (Data/Número + asc/desc);
│   │       │                              compartilhado entre as telas Vendas e Baixa
│   │       ├── VendasPorData.tsx       → agrupa por data (ou lista plana quando ordenado por número)
│   │       ├── VendaLinha.tsx          → uma linha de venda em CSS Grid (colunas fixas,
│   │       │                              exporta gridTemplateBaixa() usado também no header)
│   │       ├── VendaLinhaHeader.tsx    → cabeçalho de colunas (Nº/Valor/Pagante/Cliente/Forma)
│   │       ├── BarraAcaoSelecionados.tsx → "Dar baixa em N vendas" + total
│   │       └── ConfirmarSenhaModal.tsx   → reautenticação antes de baixar
│   │
│   ├── lib/
│   │   ├── firebase/
│   │   │   └── admin.ts            → inicializa firebase-admin (singleton)
│   │   ├── auth/
│   │   │   ├── session.ts          → cria/valida JWT, lê/escreve cookie httpOnly
│   │   │   ├── exigirSessao.ts     → SessaoExpiradaError + exigirSessao(), usado por toda
│   │   │   │                          Server Action autenticada (vendas.actions, pessoas.actions)
│   │   │   ├── password.ts         → compara hash da senha do .env
│   │   │   └── rateLimit.ts        → bloqueio simples por tentativas de login
│   │   ├── validation/
│   │   │   └── schemas.ts          → schemas zod (Venda, Pessoa, Login, Filtros)
│   │   └── utils/
│   │       ├── date.ts             → parse/format dd/mm/aaaa ↔ ISO
│   │       ├── currency.ts         → parse/format R$
│   │       ├── firestoreQueries.ts → helpers de query (prefixo, filtros combinados)
│   │       ├── formaPagamento.ts   → rótulo ("Promissória (Pix)") e cor (classeFormaPagamento)
│   │       │                          por tipo de pagamento — Pix verde, Depósito azul,
│   │       │                          Transferência violeta, promissória com anel âmbar
│   │       └── ordenarVendas.ts    → ordenação em memória por data ou por número (natural sort)
│   │
│   ├── types/
│   │   └── index.ts                → Venda, Pessoa, TipoPagamento, SessionPayload,
│   │                                    ActionResult (com code?: "SESSAO_EXPIRADA")
│   │
│   └── hooks/
│       ├── useEnterFlow.ts           → controla a cadeia de Enter entre campos
│       ├── useDebouncedValue.ts      → debounce da busca de autocomplete
│       └── useSessaoExpirada.ts      → cliente: se uma Server Action devolver
│                                         code "SESSAO_EXPIRADA", redireciona para /login

Regras de negócio importantes (atuais):
- Uma venda começa "aberta" (fechada: false). Ao "Fechar Caixa" com vendaConsig preenchido,
  vira fechada: true — só então aparece na tela de Baixa.
- "Dar baixa" DELETA o documento da venda no Firestore (não fica histórico). A tela de Baixa
  só pode enxergar fechada === true, já que baixadas somem do banco. Por isso o status exibido
  na tela de Vendas é só "Aberta"/"Fechada" (não existe mais "Baixada" — o registro já sumiu).
- vendaConsig (número da venda) é único: criarVenda() e adicionarNumeroVenda() recusam duplicado.
- promissoria é um campo booleano independente de tipoPagamento; a combinação dos dois define
  o rótulo e a cor exibidos via formaPagamento.ts. Pode ser filtrada separadamente em
  FiltrosBaixa (compartilhado entre Vendas e Baixa).
- Ordenação (Data/Número, asc/desc) é calculada em memória no cliente (ordenarVendas.ts) a
  partir do resultado já filtrado pelo servidor — evita multiplicar índices compostos no Firestore.
  O mesmo vale para o filtro de promissória em listarVendas() — filtrado em memória, não no Firestore.
- Toda Server Action que precisa de sessão chama exigirSessao(), que lança SessaoExpiradaError
  se o cookie estiver ausente/expirado. Cada action captura esse erro no catch e devolve
  { ok: false, code: "SESSAO_EXPIRADA" }. No cliente, useSessaoExpirada() intercepta esse code
  e redireciona para /login automaticamente — evita o usuário ficar preso numa tela travada.
- VendaLinha/VendaLinhaVenda usam CSS Grid com gridTemplateColumns definido em função exportada
  (gridTemplateBaixa/gridTemplateVendas) e reaproveitada pelo respectivo Header — garante que
  cabeçalho e linhas fiquem sempre alinhados, mesmo com conteúdo de tamanhos diferentes.
