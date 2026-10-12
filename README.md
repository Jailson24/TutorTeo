# Tutor Teo — Escola de Pregadores

Aplicativo web responsivo e instalável (PWA), com interface em português e API serverless na Vercel.

## Requisitos
- Node.js LTS
- Conta na Vercel
- Chave da API Groq

## Executar localmente
1. Instale as dependências: `npm install`
2. Crie `.env.local` na raiz com:
   ```env
   GROQ_API_KEY=sua_chave_real
   GROQ_MODEL=openai/gpt-oss-20b
   ```
3. Execute: `npm run dev`

Não publique sua chave da Groq no GitHub. Configure-a como variável de ambiente na Vercel.

## Publicar
1. Envie os arquivos deste projeto para um repositório GitHub.
2. Na Vercel, escolha **Add New → Project** e importe esse repositório.
3. Em **Settings → Environment Variables**, adicione `GROQ_API_KEY` e `GROQ_MODEL` (`openai/gpt-oss-20b`, desde que disponível para sua conta).
4. Faça o deploy ou redeploy.
5. Abra o domínio HTTPS fornecido pela Vercel.

## Instalar como aplicativo
- **Android/Chrome:** abra o domínio da Vercel e use “Instalar aplicativo” ou “Adicionar à tela inicial”.
- **Desktop/Chrome ou Edge:** use o ícone/opção de instalação do navegador; o botão do site aparece quando o navegador oferece o evento de instalação.
- **iPhone/iPad:** abra no Safari, toque em Compartilhar e selecione “Adicionar à Tela de Início”.

O app guarda a interface básica para abrir offline, mas as respostas da IA precisam de internet. O histórico da conversa fica apenas na memória da página e reinicia ao recarregar.

## Importante sobre GitHub
O GitHub guarda o código. Para que `/api/chat` funcione com a chave secreta da Groq, publique o projeto na Vercel (ou em outro host com funções de servidor). GitHub Pages sozinho hospeda arquivos estáticos e não executa `api/chat.js`.
