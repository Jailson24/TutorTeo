import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    try {
        const perguntaDoAluno = req.body.prompt;
        let arquivosProntos = [];
        
        // Solicita a lista de arquivos vinculados à sua chave
        const listaDeArquivos = await ai.files.list();
        
        // O "for await" é a correção exata para ler as listas assíncronas do Google
        for await (const arquivo of listaDeArquivos) {
            if (arquivo.mimeType === 'application/pdf') {
                arquivosProntos.push(arquivo);
            }
        }

        if (arquivosProntos.length === 0) {
            return res.status(400).json({ error: "Nenhuma apostila em PDF pronta foi encontrada na sua conta." });
        }

        // Prepara a identidade dos arquivos no formato exigido pela IA
        const arquivosFormatados = arquivosProntos.map(arquivo => ({
            fileData: {
                fileUri: arquivo.uri,
                mimeType: arquivo.mimeType
            }
        }));

        // Consulta a IA enviando as referências da nuvem + pergunta do aluno
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
                ...arquivosFormatados,
                perguntaDoAluno
            ],
            config: {
                systemInstruction: "Você é o Tutor Teo, o assistente teológico da Escola de Pregadores. Responda ESTRITAMENTE com base nos documentos PDF fornecidos. Se a resposta não estiver no material, diga 'Este assunto não é abordado nas apostilas atuais da nossa escola'."
            }
        });

        res.status(200).json({ resposta: response.text });

    } catch (error) {
        console.error("Erro no processamento:", error);
        res.status(500).json({ error: "Erro interno. O Tutor Teo não conseguiu acessar a biblioteca na nuvem." });
    }
}