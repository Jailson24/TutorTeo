const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse'); // Importação corrigida para padrão CommonJS

async function extrairTextos() {
  const pastaApostilas = './apostilas';
  const blocos = [];

  if (!fs.existsSync(pastaApostilas)) {
    console.error("A pasta 'apostilas' não foi encontrada. Crie a pasta e adicione os PDFs.");
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
      // Uso correto da função da biblioteca pdf-parse
      const data = await pdf(dataBuffer);
      const textoCompleto = data.text;
      
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
      
    } catch (error) {
      console.error(`Erro ao ler o arquivo ${arquivo}:`, error);
    }
  }

  fs.writeFileSync('base-de-dados.json', JSON.stringify(blocos, null, 2));
  console.log(`Sucesso! Todos os PDFs foram combinados e divididos em ${blocos.length} partes.`);
}

extrairTextos();