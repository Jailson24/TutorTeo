import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';

async function extrairTextos() {
  const pastaApostilas = './apostilas';
  const blocos = [];

  if (!fs.existsSync(pastaApostilas)) {
    console.error("A pasta 'apostilas' não foi encontrada.");
    return;
  }

  const arquivos = fs.readdirSync(pastaApostilas).filter(file => file.endsWith('.pdf'));

  if (arquivos.length === 0) {
    console.log("Nenhum PDF encontrado na pasta 'apostilas'.");
    return;
  }

  console.log(`Encontrados ${arquivos.length} PDFs. Iniciando leitura...`);

  for (const arquivo of arquivos) {
    const caminhoArquivo = path.join(pastaApostilas, arquivo);
    console.log(`Lendo: ${arquivo}...`);
    
    const dataBuffer = fs.readFileSync(caminhoArquivo);
    
    try {
      // Usando a API moderna da biblioteca pdf-parse
      const parser = new PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      const textoCompleto = result.text;
      
      const paragrafos = textoCompleto.split(/\n\s*\n/); 
      let blocoAtual = "";

      for (let p of paragrafos) {
        if (p.trim().length === 0) continue;
        if (blocoAtual.length + p.length > 1000) {
          blocos.push({ texto: blocoAtual.trim(), origem: arquivo });
          blocoAtual = p + " ";
        } else {
          blocoAtual += p + " ";
        }
      }
      if (blocoAtual.trim().length > 0) {
        blocos.push({ texto: blocoAtual.trim(), origem: arquivo });
      }
      
      await parser.destroy(); // Libera a memória após ler o PDF
    } catch (error) {
      console.error(`Erro ao ler o arquivo ${arquivo}:`, error);
    }
  }

  fs.writeFileSync('base-de-dados.json', JSON.stringify(blocos, null, 2));
  console.log(`Sucesso! Todos os PDFs foram combinados e divididos em ${blocos.length} partes.`);
}

extrairTextos();