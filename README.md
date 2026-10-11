# Tutor Teo — Escola de Pregadores

## Estrutura

```text
tutor-teo/
├── api/
│   └── chat.js
├── index.html
├── package.json
├── vercel.json
├── .env.example
└── .gitignore
```

## Configuração local

1. Instale Node.js LTS.
2. Abra um terminal nesta pasta.
3. Execute `npm install`.
4. Instale a CLI da Vercel se necessário: `npm install -g vercel`.
5. Copie `.env.example` para `.env.local` e substitua `sua_chave_groq_aqui` por uma chave criada no painel da Groq.
6. Execute `npx vercel dev` e abra o endereço local informado no terminal.

Nunca coloque a chave da Groq dentro do `index.html` nem a publique no GitHub.

## Publicação na Vercel

1. Envie estes arquivos para um repositório Git ou importe a pasta pelo fluxo de publicação disponível na Vercel.
2. Nas configurações do projeto na Vercel, abra **Settings → Environment Variables**.
3. Crie `GROQ_API_KEY` com o valor da sua chave. Opcionalmente, configure `GROQ_MODEL` como `openai/gpt-oss-20b`.
4. Faça um novo deploy depois de adicionar ou alterar as variáveis.

A Vercel reconhece `api/chat.js` como uma função serverless. O frontend chama essa função pelo caminho `/api/chat`.

## Observações

- O histórico é mantido apenas na memória da página atual; recarregar a página apaga a conversa.
- Esta versão valida mensagens e evita inserir conteúdo de chat como HTML, mas não inclui login nem limitação de requisições por usuário. Para uso público, adicione rate limiting e, se necessário, autenticação para controlar custos e abuso.
- O modelo padrão deve estar habilitado na sua conta Groq. Você pode trocar `GROQ_MODEL` nas variáveis de ambiente sem editar o código.
