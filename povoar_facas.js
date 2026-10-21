// povoar_facas.js
require('dotenv').config(); // <-- ADICIONE ESTA LINHA PARA LER O .ENV

const fs = require('fs');
const path = require('path');
const db = require('./db');

async function povoarFacas() {
    try {
        console.log('A ler o ficheiro JSON...');
        
        // Lê o ficheiro JSON que deve estar na mesma pasta
        const jsonPath = path.join(__dirname, 'catalogo_facarias_ecocaixas_chapas_formatos.json');
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(rawData);

        // Junta as facas rotativas e planas num único array
        const facasRotativas = data.categorias.rotativa || [];
        const facasPlanas = data.categorias.plana || [];
        const todasFacas = [...facasRotativas, ...facasPlanas];

        console.log(`Foram encontradas ${todasFacas.length} facas no total. A iniciar a importação para a base de dados...`);

        let processadas = 0;

        for (const f of todasFacas) {
            const query = `
                INSERT INTO facas (
                    id, categoria, modelo, tamanho_referencia, medida, 
                    versao, componente, configuracao, utilizacao, chapas_utilizadas, foto
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    categoria=VALUES(categoria), modelo=VALUES(modelo), 
                    tamanho_referencia=VALUES(tamanho_referencia), medida=VALUES(medida), 
                    versao=VALUES(versao), componente=VALUES(componente),
                    configuracao=VALUES(configuracao), utilizacao=VALUES(utilizacao),
                    chapas_utilizadas=VALUES(chapas_utilizadas), foto=VALUES(foto)
            `;
            
            // Converte o array de chapas (se existir) para formato JSON
            const chapasJson = JSON.stringify(f.chapas_utilizadas || []);

            await db.promise().query(query, [
                f.id,
                f.categoria,
                f.modelo,
                f.tamanho_referencia || null,
                f.medida || null,
                f.versao || null,
                f.componente || null,
                f.configuracao || null,
                f.utilizacao || null,
                chapasJson,
                f.foto || null
            ]);
            
            processadas++;
            process.stdout.write(`\rProcessando: ${processadas} / ${todasFacas.length}`);
        }

        console.log(`\n\n✅ Sucesso! ${processadas} facas foram inseridas/atualizadas na base de dados.`);
        
        // Encerra a conexão com o banco e finaliza o script
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Ocorreu um erro ao povoar a tabela:', error);
        process.exit(1);
    }
}

povoarFacas();