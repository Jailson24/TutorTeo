const Groq = require("groq-sdk");
const Fuse = require("fuse.js");
const fs = require("fs");
const path = require("path");

// Carrega a base de dados usando __dirname para maior fiabilidade na Vercel
const dbPath = path.join(__dirname, "..", "base-de-dados.json");
let baseDeDados = [];
try {
  const fileContent = fs.readFileSync(dbPath, "utf-8");
  baseDeDados = JSON.parse(fileContent);
  console.log(`Base de dados carregada com ${baseDeDados.length} blocos.`);
} catch (error) {
  console.error("Erro ao carregar base-de-dados.json no caminho:", dbPath);
  console.error(error);
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
    console.error("ERRO: GROQ_API_KEY não encontrada nas variáveis de ambiente.");
    return res.status(500).json({ error: "Serviço temporariamente indisponível. Chave API em falta." });
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
      return res.status(400).json({ error: "A última mensagem precisa ser uma pergunta do aluno." });
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
      model: process.env.GROQ_MODEL || "llama3-8b-8192",
      messages: [
        { role: "system", content: promptFinal },
        ...validMessages
      ],
      temperature: 0.3,
      max_completion_tokens: 1500
    });

    const resposta = completion.choices?.[0]?.message?.content?.trim();
    if (!resposta) {
        console.error("ERRO: Resposta da Groq vazia ou inválida.");
      return res.status(502).json({ error: "O Tutor Teo não conseguiu gerar uma resposta." });
    }

    return res.status(200).json({ resposta });

  } catch (error) {
    // Este log detalhado no servidor da Vercel é vital para o diagnóstico
    console.error("Erro interno na API:", error);
    return res.status(502).json({ error: "Falha na conexão com a IA. Tente novamente. Detalhes no log da Vercel." });
  }
};