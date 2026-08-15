# Sistema de Vendas

Sistema interno de cadastro e baixa de vendas, com autenticação simples de
usuário único, banco de dados Firebase Firestore e deploy na Vercel.

## Stack

- Next.js 14+ (App Router, Server Actions)
- TypeScript
- Tailwind CSS
- Firebase Admin SDK (Firestore) — acesso exclusivo pelo servidor
- Autenticação própria via cookie httpOnly assinado (JWT)

## 1. Instalação

\`\`\`bash
npm install
\`\`\`

## 2. Criar projeto no Firebase

1. Acesse https://console.firebase.google.com e crie um novo projeto.
2. Ative o **Firestore Database** (modo produção).
3. Vá em **Configurações do projeto → Contas de serviço → Gerar nova chave privada**.
   Isso baixa um JSON com \`project_id\`, \`client_email\` e \`private_key\`.
4. Aplique as regras de segurança e índices deste repositório:

\`\`\`bash
npm install -g firebase-tools
firebase login
firebase init firestore   # aponte para o projeto criado; aceite usar firestore.rules e firestore.indexes.json existentes
firebase deploy --only firestore:rules,firestore:indexes
\`\`\`

As regras (\`firestore.rules\`) bloqueiam **todo** acesso direto ao banco — o
único caminho é pelo Firebase Admin SDK, usado exclusivamente dentro das
Server Actions do Next.js (nunca exposto ao client).

## 3. Configurar variáveis de ambiente

Copie \`.env.example\` para \`.env.local\` e preencha:

\`\`\`bash
cp .env.example .env.local
\`\`\`

- \`AUTH_USER\`: o nome de usuário único que terá acesso.
- \`AUTH_PASSWORD_HASH\`: gere com o script abaixo (nunca coloque a senha em texto puro):

\`\`\`bash
npx tsx scripts/gerar-hash-senha.ts "suaSenhaForte123"
\`\`\`

- \`JWT_SECRET\`: gere um valor aleatório forte:

\`\`\`bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
\`\`\`

- \`FIREBASE_PROJECT_ID\`, \`FIREBASE_CLIENT_EMAIL\`, \`FIREBASE_PRIVATE_KEY\`: copie do
  JSON baixado no passo 2. **Atenção**: \`FIREBASE_PRIVATE_KEY\` deve manter as
  quebras de linha como \`\\n\` (copie o valor do JSON exatamente como está,
  entre aspas).

## 4. Rodar localmente

\`\`\`bash
npm run dev
\`\`\`

Acesse \`http://localhost:3000\` — você será redirecionado para \`/login\`.

## 5. Deploy na Vercel

1. Suba este repositório no GitHub.
2. Na Vercel, importe o repositório.
3. Em **Settings → Environment Variables**, adicione as mesmas variáveis do
   \`.env.local\` (todas — \`AUTH_USER\`, \`AUTH_PASSWORD_HASH\`, \`JWT_SECRET\`,
   \`FIREBASE_PROJECT_ID\`, \`FIREBASE_CLIENT_EMAIL\`, \`FIREBASE_PRIVATE_KEY\`).
4. Deploy.

⚠️ Ao colar \`FIREBASE_PRIVATE_KEY\` na Vercel, cole o valor com \`\\n\` literais
(como está no JSON) — o código já faz a conversão para quebras de linha reais.

## Estrutura do projeto

\`\`\`
src/
├── app/                  → páginas (rotas) e Server Actions
│   ├── login/, menu/, cadastro/, baixa/
│   └── actions/          → auth, pessoas, vendas (isoladas por domínio)
├── components/
│   ├── ui/                → componentes genéricos reutilizáveis
│   ├── login/, menu/, cadastro/, baixa/
├── lib/
│   ├── firebase/admin.ts  → conexão com Firestore (server-only)
│   ├── auth/               → sessão, senha, rate limit
│   ├── validation/          → schemas Zod
│   └── utils/                → data, moeda, buscas
├── hooks/                → useEnterFlow (fluxo de Enter), useDebouncedValue
└── types/                → tipos centrais do domínio
middleware.ts             → protege todas as rotas privadas
scripts/gerar-hash-senha.ts → utilitário para gerar o hash de senha
\`\`\`

## Funcionalidades

**Login**: usuário/senha únicos, vindos do \`.env\`. Rate limit local contra
tentativas repetidas. Sessão via cookie httpOnly (8h de duração).

**Menu**: escolha entre Cadastrar e Baixa.

**Cadastro**: formulário com fluxo 100% por teclado — Enter avança
automaticamente entre os campos (Pagt. Nome → Cliente → Data → Venda/Consig
→ Valor → Salvar). Nomes de pagantes e clientes ficam na mesma coleção
(\`pessoas\`) e alimentam autocomplete por prefixo.

**Baixa**: filtro opcional por período, nome e tipo de pagamento; lista
agrupada por data (mais antigas primeiro); seleção múltipla com checkbox;
total dos selecionados sempre visível; confirmação em duas etapas (diálogo +
senha novamente) antes de baixar as vendas selecionadas.

## Decisões técnicas relevantes

- Valores monetários são armazenados e manipulados sempre em **centavos
  (inteiro)**, nunca em float, para evitar erros de arredondamento.
- Toda escrita no Firestore passa por validação Zod no servidor, mesmo que o
  client já tenha validado — nunca confiar só na validação do front.
- O filtro por nome na tela de Baixa é aplicado em memória após a busca no
  Firestore (que não suporta \`contains\` nativamente), o que é aceitável para
  o volume esperado deste sistema. Se o volume crescer muito, considerar
  Algolia/Typesense no futuro.
