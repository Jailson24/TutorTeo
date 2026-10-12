const Groq = require("groq-sdk");
const Fuse = require("fuse.js");

let baseDeDados = [];
try {
  baseDeDados = require("../base-de-dados.json");
  console.log(`SUCESSO: Base de dados carregada com ${baseDeDados.length} blocos.`);
} catch (error) {
  console.error("ERRO CRÍTICO: Não foi possível ler o base-de-dados.json", error);
}

const buscador = new Fuse(baseDeDados, {
  keys: ["texto"],
  includeScore: true,
  threshold: 0.5,
  ignoreLocation: true,
});

const SYSTEM_PROMPT = `Você é o Tutor Teo, assistente teológico da Escola de Pregadores.
Responda em português brasileiro, com clareza, respeito e fundamentação bíblica.
Sua principal função é responder baseando-se EXCLUSIVAMENTE nos trechos da apostila fornecidos abaixo.
Se a informação não constar nos trechos fornecidos, diga: "Desculpe, mas não encontrei essa informação no meu material de estudo."
Não invente informações e não use conhecimentos externos se eles conflitarem com a apostila.`;

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

    const ultimaPergunta = validMessages[validMessages.length - 1].content;
    const resultadosBusca = buscador.search(ultimaPergunta);
    
    const melhoresTrechos = resultadosBusca.slice(0, 5).map(resultado => resultado.item.texto);
    const contextoApostila = melhoresTrechos.length > 0 
      ? melhoresTrechos.join("\n\n---\n\n") 
      : "Nenhum trecho relevante encontrado na apostila.";

    const promptFinal = `${SYSTEM_PROMPT}\n\nTRECHOS DA APOSTILA:\n${contextoApostila}`;

    const groq = new Groq({ apiKey });
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // Modelo atualizado e suportado atualmente na Groq
      messages: [
        { role: "system", content: promptFinal },
        ...validMessages
      ],
      temperature: 0.3,
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
    return res.status(502).json({ error: error.message || "Falha na conexão com a IA. Tente novamente." });
  }
};