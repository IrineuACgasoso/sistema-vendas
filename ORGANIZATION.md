sistema-vendas/
├── .env.local                      (nunca commitado)
├── .env.example                    (commitado, sem valores reais)
├── middleware.ts                   (protege NAVEGAÇÃO de páginas; server actions
│                                      se autoprotegem via exigirSessao(), ver abaixo)
├── firebase.json
├── firestore.indexes.json          → índices compostos usados pelas queries de vendas
├── firestore.rules
├── next.config.js                  → única config do Next (não duplicar em .mjs/.ts)
├── postcss.config.js               → única config do PostCSS (tailwindcss v3 + autoprefixer)
├── .eslintrc.json                  → única config do ESLint (formato legado, compatível
│                                      com eslint@8 — não usar eslint.config.mjs/flat config)
├── tailwind.config.js              → content inclui app/, components/ E lib/ (as classes
│                                      de cor de formaPagamento.ts vivem em lib/utils/)
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
│   │   │   └── page.tsx            → renderiza <VendasContainer /> (mostra vendas abertas E fechadas;
│   │   │                              tem modos de editar/excluir e sincronização automática, ver abaixo)
│   │   ├── baixa/
│   │   │   └── page.tsx            → renderiza <BaixaContainer /> (mostra só vendas fechadas)
│   │   └── actions/                (Server Actions, isoladas por domínio)
│   │       ├── auth.actions.ts     → login(), logout(), confirmarSenhaAtual()
│   │       ├── pessoas.actions.ts  → buscarPessoasPorPrefixo(), salvarPessoaSeNova()
│   │       ├── vendas.actions.ts   → criarVenda(), listarVendas(), fecharVendas(),
│   │       │                          adicionarNumeroVenda(), darBaixa(), atualizarVenda(),
│   │       │                          excluirVendas()
│   │
│   ├── components/
│   │   ├── ui/                     (componentes burros, reutilizáveis, sem lógica de negócio)
│   │   │   ├── Button.tsx
│   │   │   ├── TextInput.tsx
│   │   │   ├── DateInput.tsx       → 3 campos segmentados (dd / mm / aaaa) independentes —
│   │   │   │                          editar um dígito não desloca os outros; sempre começa
│   │   │   │                          vazio (não há máscara reconstruída a cada tecla)
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
│   │   │   ├── CadastroForm.tsx        → orquestra o formulário; campo Data sempre inicia
│   │   │   │                              vazio (e volta vazio a cada nova venda cadastrada)
│   │   │   ├── TipoPagamentoRadio.tsx  → Pix/Depósito/Transferência
│   │   │   ├── PromissoriaSelect.tsx   → select "Padrão"/"Promissória", independente do tipo de pagamento
│   │   │   └── NomeAutocomplete.tsx    → reaproveitado p/ Pagt. e Cliente; navegação por
│   │   │                                  setas do teclado nas sugestões (sem precisar de mouse);
│   │   │                                  capitaliza a primeira letra de cada palavra ao digitar
│   │   │                                  (capitalizarPalavras(), estilo teclado Android)
│   │   │
│   │   ├── vendas/                 (tela "Vendas": vê tudo — abertas e fechadas)
│   │   │   ├── VendasContainer.tsx        → orquestra estado geral da tela; ícones de
│   │   │   │                                 Editar/Excluir no header; botão "Selecionar
│   │   │   │                                 todas" (só vendas fecháveis); polling silencioso
│   │   │   │                                 a cada 5s pra sincronizar com outras abas sem F5
│   │   │   │                                 (pausa durante edição/exclusão ou aba oculta)
│   │   │   ├── VendasPorDataVenda.tsx     → agrupa por data (ou lista plana quando ordenado por número);
│   │   │   │                                 repassa os modos de edição/exclusão pra cada linha
│   │   │   ├── VendaLinhaVenda.tsx        → uma linha de venda em CSS Grid (colunas fixas:
│   │   │   │                                 Valor/Pagante/Cliente/Nº/Forma/Status), exporta
│   │   │   │                                 gridTemplateVendas() usado também no header;
│   │   │   │                                 em modo edição vira um formulário inline (nome,
│   │   │   │                                 valor, número) com Salvar/Cancelar; em modo
│   │   │   │                                 exclusão o checkbox seleciona pra apagar
│   │   │   ├── VendaLinhaVendaHeader.tsx  → cabeçalho de colunas
│   │   │   ├── BarraFecharCaixa.tsx / BarraFecharSelecionados.tsx → ação de fechar vendas selecionadas
│   │   │   └── AdicionarNumeroModal.tsx   → preencher vendaConsig depois (número pode se
│   │   │                                     repetir entre vendas, ver regras abaixo)
│   │   │
│   │   └── baixa/                  (tela "Baixa": vê só vendas fechada === true)
│   │       ├── BaixaContainer.tsx      → orquestra estado geral da tela
│   │       ├── FiltrosBaixa.tsx        → data, nome, tipo (Todos/Pix/Depósito/Transferência/
│   │       │                              Promissórias — a opção Promissórias fica dentro do
│   │       │                              mesmo select de tipo, ver regras abaixo) e ordenação
│   │       │                              (Data/Número + asc/desc); compartilhado entre Vendas e Baixa
│   │       ├── VendasPorData.tsx       → agrupa por data (ou lista plana quando ordenado por número)
│   │       ├── VendaLinha.tsx          → uma linha de venda em CSS Grid (colunas fixas,
│   │       │                              exporta gridTemplateBaixa() usado também no header)
│   │       ├── VendaLinhaHeader.tsx    → cabeçalho de colunas (Nº/Valor/Pagante/Cliente/Forma)
│   │       ├── BarraAcaoSelecionados.tsx → "Dar baixa em N vendas" + total
│   │       └── ConfirmarSenhaModal.tsx   → reautenticação antes de baixar; reutilizado também
│   │                                        pela exclusão de vendas (título/mensagem/label do
│   │                                        botão configuráveis via props, com default = baixa)
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
│   │   │   └── schemas.ts          → schemas zod (Venda, Pessoa, Login, Filtros, EditarVenda,
│   │   │                              ExcluirVendas)
│   │   └── utils/
│   │       ├── date.ts             → parse/format dd/mm/aaaa ↔ ISO
│   │       ├── currency.ts         → parse/format R$
│   │       ├── texto.ts            → capitalizarPalavras() — capitaliza a 1ª letra de cada
│   │       │                          palavra sem alterar o resto do texto já digitado
│   │       ├── firestoreQueries.ts → helpers de query (prefixo, filtros combinados)
│   │       ├── formaPagamento.ts   → rótulo ("Promissória (Pix)") e cor (classeFormaPagamento)
│   │       │                          por tipo de pagamento — Pix verde, Depósito azul,
│   │       │                          Transferência violeta, promissória com anel âmbar
│   │       │                          (essas classes Tailwind só são geradas porque
│   │       │                          tailwind.config.js inclui src/lib no content)
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
- Uma venda começa "aberta" (fechada: false). Ao "Fechar Caixa" com vendaConsig preenchido
  (OU sendo promissória — única exceção que não exige número), vira fechada: true — só então
  aparece na tela de Baixa.
- "Dar baixa" DELETA o documento da venda no Firestore (não fica histórico). A tela de Baixa
  só pode enxergar fechada === true, já que baixadas somem do banco. Por isso o status exibido
  na tela de Vendas é só "Aberta"/"Fechada" (não existe mais "Baixada" — o registro já sumiu).
- vendaConsig (número da venda) NÃO é único — de propósito. Clientes que parcelam um Pix em
  vários lançamentos usam o mesmo número várias vezes; criarVenda(), adicionarNumeroVenda() e
  atualizarVenda() não fazem mais nenhuma checagem de duplicidade.
- Além de "Dar baixa", a tela de Vendas tem dois modos extras acionados pelos ícones no header:
  · Editar: clicar numa venda aberta abre edição inline de nome, valor e número; salva via
    atualizarVenda() (bloqueado se a venda já estiver fechada).
  · Excluir: ativa checkboxes de seleção (independentes dos de "Fechar Caixa"); ao confirmar,
    pede senha via ConfirmarSenhaModal com aviso explícito de que a exclusão é permanente e
    diferente de dar baixa; chama excluirVendas(), que apaga os documentos definitivamente.
- promissoria é um campo booleano independente de tipoPagamento; a combinação dos dois define
  o rótulo e a cor exibidos via formaPagamento.ts. No filtro de Tipo (FiltrosBaixa, compartilhado
  entre Vendas e Baixa), a opção "Promissórias" vive dentro do mesmo select de Pix/Depósito/
  Transferência. Selecionar uma forma de pagamento específica (Pix/Depósito/Transferência)
  NUNCA mistura promissórias — essas só aparecem quando "Promissórias" é selecionado
  explicitamente (aí aparecem todas, de qualquer forma de pagamento). Esse filtro é calculado
  em memória em listarVendas(), não no Firestore.
- Ordenação (Data/Número, asc/desc) é calculada em memória no cliente (ordenarVendas.ts) a
  partir do resultado já filtrado pelo servidor — evita multiplicar índices compostos no Firestore.
- A tela de Vendas faz polling silencioso (a cada 5s, via setInterval em VendasContainer) pra
  pegar vendas cadastradas em outra aba/pop-up sem precisar de F5. Ele pausa sozinho enquanto o
  usuário está no modo edição/exclusão, ou se a aba está em segundo plano (document.hidden).
- Toda Server Action que precisa de sessão chama exigirSessao(), que lança SessaoExpiradaError
  se o cookie estiver ausente/expirado. Cada action captura esse erro no catch e devolve
  { ok: false, code: "SESSAO_EXPIRADA" }. No cliente, useSessaoExpirada() intercepta esse code
  e redireciona para /login automaticamente — evita o usuário ficar preso numa tela travada.
- VendaLinha/VendaLinhaVenda usam CSS Grid com gridTemplateColumns definido em função exportada
  (gridTemplateBaixa/gridTemplateVendas) e reaproveitada pelo respectivo Header — garante que
  cabeçalho e linhas fiquem sempre alinhados, mesmo com conteúdo de tamanhos diferentes. Na tela
  de Vendas a ordem das colunas é Valor → Pagante → Cliente → Nº → Forma → Status.
- Nomes digitados em Pagante/Cliente (NomeAutocomplete) são auto-capitalizados por palavra
  (capitalizarPalavras(), em lib/utils/texto.ts) — só a 1ª letra de cada palavra é mexida, o
  resto do texto digitado não é alterado.