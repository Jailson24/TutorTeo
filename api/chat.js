import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    try {
        const perguntaDoAluno = req.body.prompt;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Você é o Tutor Teo, o assistente teológico da Escola de Pregadores. Responda de forma clara, educada e fundamentada."
                },
                {
                    role: "user",
                    content: perguntaDoAluno,
                },
            ],
            model: "llama3-70b-8192",
            temperature: 0.5,
        });

        res.status(200).json({ resposta: chatCompletion.choices[0]?.message?.content || "" });

    } catch (error) {
        console.error("Erro no Llama/Groq:", error);
        res.status(500).json({ error: "Erro de conexão com o servidor do Tutor Teo." });
    }
}