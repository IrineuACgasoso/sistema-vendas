sistema-vendas/
├── .env.local                      (nunca commitado)
├── .env.example                    (commitado, sem valores reais)
├── middleware.ts                   (protege rotas, valida cookie de sessão)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx                → redireciona / conforme sessão
│   │   ├── login/
│   │   │   └── page.tsx            → só renderiza <LoginForm />
│   │   ├── menu/
│   │   │   └── page.tsx            → só renderiza <MenuSelector />
│   │   ├── cadastro/
│   │   │   └── page.tsx            → renderiza <CadastroForm />
│   │   ├── baixa/
│   │   │   └── page.tsx            → renderiza <BaixaContainer />
│   │   └── actions/                (Server Actions, isoladas por domínio)
│   │       ├── auth.actions.ts     → login(), logout()
│   │       ├── pessoas.actions.ts  → buscarPessoasPorPrefixo(), salvarPessoaSeNova()
│   │       ├── vendas.actions.ts   → criarVenda(), listarVendas(), darBaixa()
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
│   │   │   └── Spinner.tsx
│   │   │
│   │   ├── login/
│   │   │   └── LoginForm.tsx
│   │   │
│   │   ├── menu/
│   │   │   └── MenuSelector.tsx
│   │   │
│   │   ├── cadastro/
│   │   │   ├── CadastroForm.tsx        → orquestra o formulário
│   │   │   ├── TipoPagamentoRadio.tsx  → Pix/Depósito/Transferência
│   │   │   └── NomeAutocomplete.tsx    → reaproveitado p/ Pagt. e Cliente
│   │   │
│   │   └── baixa/
│   │       ├── BaixaContainer.tsx      → orquestra estado geral da tela
│   │       ├── FiltrosBaixa.tsx        → data, nome, tipo
│   │       ├── VendasPorData.tsx       → agrupa e renderiza títulos de data
│   │       ├── VendaLinha.tsx          → uma linha de venda (com flex-wrap)
│   │       ├── BarraAcaoSelecionados.tsx → "Dar baixa em N vendas" + total
│   │       └── ConfirmarSenhaModal.tsx   → reautenticação antes de baixar
│   │
│   ├── lib/
│   │   ├── firebase/
│   │   │   └── admin.ts            → inicializa firebase-admin (singleton)
│   │   ├── auth/
│   │   │   ├── session.ts          → cria/valida JWT, lê/escreve cookie httpOnly
│   │   │   ├── password.ts         → compara hash da senha do .env
│   │   │   └── rateLimit.ts        → bloqueio simples por tentativas de login
│   │   ├── validation/
│   │   │   └── schemas.ts          → schemas zod (Venda, Pessoa, Login)
│   │   └── utils/
│   │       ├── date.ts             → parse/format dd/mm/aaaa ↔ ISO
│   │       ├── currency.ts         → parse/format R$
│   │       └── firestoreQueries.ts → helpers de query (prefixo, filtros combinados)
│   │
│   ├── types/
│   │   └── index.ts                → Venda, Pessoa, TipoPagamento, SessionPayload
│   │
│   └── hooks/
│       ├── useEnterFlow.ts         → controla a cadeia de Enter entre campos
│       └── useDebouncedValue.ts    → debounce da busca de autocomplete