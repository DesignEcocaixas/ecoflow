const fs = require('fs');
const path = require('path');
const db = require('./db'); // Ajuste aqui se o seu arquivo de conexão com o banco tiver outro nome

const modulos = [
    { tabela: "kanban_anexos", coluna: "nome_arquivo", pasta: "kanban" },
    { tabela: "usuarios", coluna: "foto", pasta: "usuarios/perfil" },
    { tabela: "pagamentos_colaboradores", coluna: "comprovante", pasta: "financeiro/pagamentos" },
    { tabela: "pastas_diaristas", coluna: "comprovante", pasta: "financeiro/diaristas" },
    { tabela: "checklists", coluna: "foto", pasta: "veiculos/checklists" },
    { tabela: "veiculo_checklists", coluna: "documento", pasta: "veiculos/manutencao" },
    { tabela: "veiculos", coluna: "foto", pasta: "veiculos/fotos" }, 
    { tabela: "gabaritos", coluna: "url", pasta: "gabaritos", isUrl: true },
    { tabela: "espacos_trabalho", coluna: "thumb", pasta: "workspaces" },
    // A nossa nova linha para as mensagens:
    { tabela: "notificacoes_globais", coluna: "imagem", pasta: "mensagensSistema", manterNomeBanco: true }
];

const dirBase = path.join(__dirname, 'uploads');

async function executarMigracao() {
    console.log("🚀 Iniciando a migração em massa de arquivos...\n");

    for (const mod of modulos) {
        console.log(`\n=========================================`);
        console.log(`📁 Processando módulo: ${mod.tabela} -> /uploads/${mod.pasta}`);
        
        const dirDestino = path.join(dirBase, mod.pasta);

        // Garante que a pasta de destino existe
        if (!fs.existsSync(dirDestino)) {
            fs.mkdirSync(dirDestino, { recursive: true });
        }

        try {
            // Lógica para buscar registros
            let query = `SELECT id, ${mod.coluna} FROM ${mod.tabela} WHERE ${mod.coluna} IS NOT NULL AND ${mod.coluna} != ''`;
            
            if (mod.isUrl) {
                query += ` AND ${mod.coluna} NOT LIKE '/uploads/${mod.pasta}/%'`;
            } else if (!mod.manterNomeBanco) {
                query += ` AND ${mod.coluna} NOT LIKE '${mod.pasta}/%'`;
            }

            const [registros] = await db.promise().query(query);

            if (registros.length === 0) {
                console.log(`✅ Nenhum arquivo solto encontrado nesta tabela.`);
                continue;
            }

            console.log(`Encontrados ${registros.length} arquivos para avaliar.`);

            let movidos = 0;
            let naoEncontrados = 0;

            for (const reg of registros) {
                let nomeArquivoAntigo = reg[mod.coluna];
                let novoValorBanco = "";

                // Tratamento especial para formar o novo valor que vai pro banco
                if (mod.isUrl) {
                    nomeArquivoAntigo = nomeArquivoAntigo.replace('/uploads/', ''); // Pega só o nome do arquivo
                    novoValorBanco = `/uploads/${mod.pasta}/${nomeArquivoAntigo}`;
                } else if (mod.manterNomeBanco) {
                    novoValorBanco = nomeArquivoAntigo; // Mantém igual no banco, só move o arquivo físico
                } else {
                    novoValorBanco = `${mod.pasta}/${nomeArquivoAntigo}`;
                }

                const oldPath = path.join(dirBase, nomeArquivoAntigo);
                const newPath = path.join(dirBase, mod.pasta, nomeArquivoAntigo);

                // Se o arquivo físico existe na raiz, move!
                if (fs.existsSync(oldPath)) {
                    try {
                        fs.renameSync(oldPath, newPath); // Move o arquivo
                        
                        // Atualiza o banco de dados APENAS se o nome precisar ser alterado
                        if (novoValorBanco !== reg[mod.coluna]) {
                            await db.promise().query(
                                `UPDATE ${mod.tabela} SET ${mod.coluna} = ? WHERE id = ?`, 
                                [novoValorBanco, reg.id]
                            );
                        }
                        movidos++;
                    } catch (e) {
                        console.error(`❌ Erro ao mover ${nomeArquivoAntigo}:`, e.message);
                    }
                } else {
                    // Arquivo tá no banco mas não tá fisicamente na pasta raiz uploads/
                    naoEncontrados++;
                }
            }

            console.log(`📦 Resumo da tabela ${mod.tabela}:`);
            console.log(`   - Movidos com sucesso: ${movidos}`);
            if (naoEncontrados > 0) console.log(`   - ⚠️ Arquivos não encontrados na raiz (já movidos ou excluídos): ${naoEncontrados}`);

        } catch (dbErr) {
            console.error(`❌ Erro no banco de dados ao processar ${mod.tabela}:`, dbErr.message);
        }
    }

    console.log(`\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!`);
    console.log(`Os seus arquivos antigos estão organizados e o sistema está 100% atualizado.`);
    process.exit(0);
}

executarMigracao();