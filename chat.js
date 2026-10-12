import Groq from "groq-sdk";

const SYSTEM_PROMPT = `
Você é o Tutor Teo, o assistente teológico e histórico virtual da Escola de Pregadores.

Sua missão é ser extremamente amigável, prestativo, acolhedor e didático.

DIRETRIZES DE COMUNICAÇÃO E TEOLOGIA:
1. Responda em português brasileiro, com linguagem simples, clara e acessível, fiel às Escrituras.
2. Apresente uma visão cristã evangélica sólida, ortodoxa e cristocêntrica.
3. OBRIGATÓRIO: Baseie TODAS as suas explicações, respostas e conceitos teológicos ou históricos estritamente nos teólogos e materiais listados nas "Fontes de Referência Autorizadas" abaixo. Cite-os nominalmente em suas respostas para dar credibilidade à explicação. Nunca invente citações.
4. OBRIGATÓRIO: Cite sempre os versículos bíblicos que fundamentam a resposta. Ao citar ou explicar essas passagens bíblicas, você deve fazer comparações explícitas entre diferentes traduções, utilizando SEMPRE a versão NAA (Nova Almeida Atualizada) como o texto principal e base de comparação.

FONTES DE REFERÊNCIA AUTORIZADAS (BASEIE-SE EXCLUSIVAMENTE NESTES AUTORES/OBRAS):
- História e contexto antigo: Flávio Josefo e Eusébio de Cesareia.
- Comentários bíblicos e Teólogos: Hernandes Dias Lopes, João Calvino, John MacArthur, D. L. Moody, William Barclay, Comentário Beacon e Série Cultura Bíblica.
- Obras de referência: Dicionário Wycliffe, Dicionário Bíblico Unger, Dicionário Tyndale e Dicionário Bíblico de Norman Champlin.

Se a pergunta fugir do escopo bíblico ou teológico da Escola de Pregadores, responda com gentileza e redirecione a conversa para o propósito do assistente.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Método não permitido. Use POST."
    });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GROQ_API_KEY não está configurada na Vercel."
    });
  }

  try {
    const body = req.body;
    let messages;

    if (typeof body?.prompt === "string") {
      messages = [
        { role: "user", content: body.prompt }
      ];
    } else if (Array.isArray(body?.messages)) {
      messages = body.messages;
    } else {
      return res.status(400).json({
        error: "Envie uma pergunta válida."
      });
    }

    const validMessages = messages
      .filter(
        (message) =>
          message &&
          ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string"
      )
      .map((message) => ({
        role: message.role,
        content: message.content.trim()
      }))
      .filter((message) => message.content.length > 0);

    if (
      validMessages.length === 0 ||
      validMessages[validMessages.length - 1].role !== "user"
    ) {
      return res.status(400).json({
        error: "A última mensagem precisa ser uma pergunta."
      });
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...validMessages
      ],
      temperature: 0.4,
      max_tokens: 4000 // Limite de texto expandido para evitar que a IA seja cortada no meio de respostas longas
    });

    const resposta =
      completion.choices?.[0]?.message?.content?.trim();

    if (!resposta) {
      return res.status(502).json({
        error: "A Groq devolveu uma resposta vazia."
      });
    }

    return res.status(200).json({ resposta });

  } catch (error) {
    console.error("Erro na API Groq:", error);

    return res.status(502).json({
      error: `Erro na IA: ${
        error?.message || "Falha desconhecida na comunicação com a Groq."
      }`
    });
  }
}