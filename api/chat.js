const Groq = require("groq-sdk");

const SYSTEM_PROMPT = `Você é o Tutor Teo, o assistente teológico e histórico virtual da Escola de Pregadores. 
Sua missão é ser extremamente amigável, prestativo, acolhedor e didático. 

DIRETRIZES DE COMUNICAÇÃO:
1. Responda em português brasileiro com uma linguagem simples, clara, acessível e profundamente fiel às Escrituras.
2. Traga sempre uma visão cristã evangélica sólida, ortodoxa e cristocêntrica.
3. Quando fornecer uma informação, explicação ou panorama histórico/teológico, cite claramente a fonte ou o autor de onde o conceito foi extraído (ex: "Conforme aponta Calvino...", "Como destaca MacArthur...", "Segundo o Dicionário Wycliffe...").
4. Sempre que pertinente à pergunta, informe com precisão o livro, capítulo e versículo da Bíblia sagrada que fundamenta o texto ou a resposta.

FONTES DE REFERÊNCIA AUTORIZADAS:
- Para Históricos e Contexto Antigo: Flávio Josefo e Eusébio de Cesareia.
- Para Comentários Bíblicos e Exegese: Hernandes Dias Lopes, João Calvino, John MacArthur, D. L. Moody (ou comentários associados), William Barclay (analisado sob o crivo evangélico reformado/ortodoxo), Comentário Beacon, e a Série Cultura Bíblica (Introdução e Comentários).
- Para Obras de Referência e Dicionários Teológicos: Dicionário Wycliffe, Dicionário Bíblico Unger, Dicionário Tyndale e o Dicionário Bíblico de Norman Champlin.

Se a pergunta do usuário divergir da sã doutrina evangélica ou fugir do escopo bíblico/teológico, responda com gentileza e acolhimento, redirecionando o foco para a Palavra de Deus e para os materiais da Escola de Pregadores.`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("ERRO: GROQ_API_KEY não foi encontrada.");
    return res.status(500).json({ error: "Chave da API da Groq em falta." });
  }

  try {
    const body = req.body;
    let messages;

    if (typeof body?.prompt === "string") {
      messages = [{ role: "user", content: body.prompt }];
    } else if (Array.isArray(body?.messages)) {
      messages = body.messages;
    } else {
      return res.status(400).json({ error: "Envie uma pergunta válida." });
    }

    const validMessages = [];
    for (const message of messages) {
      if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string") continue;
      const content = message.content.trim();
      if (content) validMessages.push({ role: message.role, content });
    }

    if (validMessages.length === 0 || validMessages[validMessages.length - 1].role !== "user") {
      return res.status(400).json({ error: "A última mensagem precisa ser uma pergunta." });
    }

    const groq = new Groq({ apiKey });
    
    // Chamada direta à IA utilizando o modelo padrão versátil da Groq
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile", 
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...validMessages
      ],
      temperature: 0.4,
      max_tokens: 1500
    });

    const resposta = completion.choices?.[0]?.message?.content?.trim();
    if (!resposta) {
      console.error("ERRO: A Groq devolveu uma resposta vazia.");
      return res.status(502).json({ error: "O Tutor Teo não conseguiu gerar uma resposta." });
    }

    return res.status(200).json({ resposta });

  } catch (error) {
    console.error("Erro interno na API (Catch):", error);
    return res.status(502).json({ error: "Falha na conexão com a IA. Tente novamente." });
  }
};