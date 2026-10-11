import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    try {
        const perguntaDoAluno = req.body.prompt;
        const diretorio = process.cwd();
        
        // Localiza todos os arquivos .pdf na raiz do projeto
        const arquivosNaPasta = fs.readdirSync(diretorio);
        const pdfs = arquivosNaPasta.filter(file => file.endsWith('.pdf'));

        if (pdfs.length === 0) {
            return res.status(400).json({ error: "Nenhuma apostila em PDF foi encontrada na biblioteca." });
        }

        // 1. Faz o upload de todos os PDFs encontrados
        const arquivosUpload = await Promise.all(pdfs.map(async (pdf) => {
            const pdfPath = path.join(diretorio, pdf);
            return await ai.files.upload({
                file: pdfPath,
                mimeType: 'application/pdf',
            });
        }));

        // 2. Prepara o formato EXATO que a nova versão do Google exige
        const arquivosFormatados = arquivosUpload.map(arquivo => ({
            fileData: {
                fileUri: arquivo.uri,
                mimeType: arquivo.mimeType
            }
        }));

        // 3. Consulta a IA enviando os PDFs formatados
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
        res.status(500).json({ error: "Erro interno ao consultar a biblioteca de apostilas." });
    }
}