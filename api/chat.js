import Groq from "groq-sdk";

const SYSTEM_PROMPT = `Você é o Tutor Teo, assistente teológico da Escola de Pregadores.
Responda em português brasileiro, com clareza, respeito e fundamentação bíblica.
Quando citar a Bíblia, informe livro, capítulo e versículo quando souber com segurança.
Diferencie o texto bíblico de interpretações teológicas e reconheça divergências entre tradições cristãs.
Não invente citações, referências bíblicas, autores ou fontes. Se não tiver certeza, diga isso claramente.
Seja acolhedor e didático, ajudando o aluno a estudar o texto e o contexto.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("A variável de ambiente GROQ_API_KEY não está configurada.");
    return res.status(500).json({ error: "Serviço temporariamente indisponível." });
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

    if (messages.length < 1 || messages.length > 12) {
      return res.status(400).json({ error: "Envie entre 1 e 12 mensagens de conversa." });
    }

    const validMessages = [];
    for (const message of messages) {
      if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string") {
        return res.status(400).json({ error: "O histórico da conversa possui um formato inválido." });
      }
      const content = message.content.trim();
      if (!content || content.length > 5000) {
        return res.status(400).json({ error: "Cada mensagem deve conter texto e ter no máximo 5.000 caracteres." });
      }
      validMessages.push({ role: message.role, content });
    }

    if (validMessages[validMessages.length - 1].role !== "user") {
      return res.status(400).json({ error: "A última mensagem precisa ser uma pergunta do aluno." });
    }

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...validMessages
      ],
      temperature: 0.5,
      max_completion_tokens: 1500
    });

    const resposta = completion.choices?.[0]?.message?.content?.trim();
    if (!resposta) {
      console.error("A Groq retornou uma resposta vazia.");
      return res.status(502).json({ error: "O Tutor Teo não conseguiu gerar uma resposta. Tente novamente." });
    }

    return res.status(200).json({ resposta });
  } catch (error) {
    console.error("Erro na API do Tutor Teo:", {
      status: error?.status,
      code: error?.code,
      message: error?.message
    });

    if (error?.status === 401 || error?.status === 403) {
      return res.status(502).json({ error: "A autenticação com o serviço de IA falhou. Verifique a chave da Groq." });
    }
    if (error?.status === 429) {
      return res.status(429).json({ error: "O serviço está recebendo muitas solicitações. Aguarde um pouco e tente novamente." });
    }
    return res.status(502).json({ error: "Não foi possível conectar ao serviço de IA. Tente novamente em instantes." });
  }
}