const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const { uploadChecklist } = require("../config/uploadConfig");
const checklistMotoristasView = require("../views/checklistMotoristasView");

//------------------------------------------------------------------------------ROTAS PARA CHECKLIST DE MOTORISTAS------------------------------------------------------------------------------
//LISTAR CHECKLISTS
router.get("/checklist-motoristas", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

    const usuario = req.session.user;

    // página atual vinda da query (?page=2)
    const page = parseInt(req.query.page || "1", 10);
    const limit = 12;
    const offset = (page - 1) * limit;

    // Filtros de Data
    const { data_inicio, data_fim } = req.query;

    const where = [];
    const paramsBase = [];

    if (data_inicio && data_inicio.trim() !== "") {
        where.push("DATE(criado_em) >= ?");
        paramsBase.push(data_inicio.trim());
    }

    if (data_fim && data_fim.trim() !== "") {
        where.push("DATE(criado_em) <= ?");
        paramsBase.push(data_fim.trim());
    }

    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

    // 1ª consulta: total de registros (pra calcular páginas)
    const sqlCount = `
    SELECT COUNT(*) AS total
    FROM checklists
    ${whereSql}
  `;

    db.query(sqlCount, paramsBase, (errCount, rowsCount) => {
        if (errCount) {
            console.error("Erro ao contar checklists:", errCount);
            return res.status(500).send("Erro ao carregar checklists.");
        }

        const total = rowsCount[0].total || 0;
        const totalPages = Math.max(1, Math.ceil(total / limit));

        // Garante que page não passe do limite
        const currentPage = Math.min(Math.max(page, 1), totalPages);
        const currentOffset = (currentPage - 1) * limit;

        // 2ª consulta: lista paginada filtrada
        const sqlLista = `
      SELECT *
      FROM checklists
      ${whereSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;

        const paramsLista = paramsBase.concat([limit, currentOffset]);

        db.query(sqlLista, paramsLista, (errLista, checklists) => {
            if (errLista) {
                console.error("Erro ao buscar checklists:", errLista);
                return res.status(500).send("Erro ao carregar checklists.");
            }

            // NOVA CONSULTA UNIFICADA: Busca Motorista, Ano e Mês agrupados
            db.query(`
                SELECT DISTINCT 
                    motorista, 
                    YEAR(criado_em) AS ano, 
                    MONTH(criado_em) AS mes 
                FROM checklists 
                WHERE motorista IS NOT NULL AND motorista != '' AND criado_em IS NOT NULL 
                ORDER BY motorista ASC, ano DESC, mes DESC
            `, (errFiltros, rowsFiltros) => {

                const filtrosData = rowsFiltros && !errFiltros ? rowsFiltros : [];

                res.send(
                    checklistMotoristasView(
                        usuario,
                        checklists,
                        { page: currentPage, totalPages, total, data_inicio, data_fim },
                        filtrosData // Passando os dados exatos de relacionamento para a View
                    )
                );
            });
        });
    });
});

// ROTA POST: CADASTRAR CHECKLIST
router.post("/checklist-motoristas/novo", uploadChecklist.single("foto"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

    const {
        veiculo, oleo, agua, freio, direcao, combustivel,
        pneu_calibragem, pneu_estado, luzes, ruidos, lixo,
        kit_pneu, acessorios_cabine, // Novos campos
        responsavel, motorista, observacao,
    } = req.body;

    // ✅ CORREÇÃO: motorista é O NOME SELECIONADO NO FORM
    if (!motorista || motorista.trim() === "") {
        return res.status(400).send("Selecione o motorista no formulário.");
    }

    // A MÁGICA AQUI: Salva com o prefixo da pasta
    const foto = req.file ? "veiculos/checklists/" + req.file.filename : null;

    db.query(
        "INSERT INTO notificacoes (mensagem, tipo) VALUES (?, 'checklist')",
        [`Checklist do veículo ${veiculo} registrado por ${req.session.user.nome}`],
        (errNotif) => {
            if (errNotif) console.error("Erro ao registrar notificação de checklist:", errNotif);
        }
    );

    const sql = `
    INSERT INTO checklists 
      (veiculo, oleo, agua, freio, direcao, combustivel,
       pneu_calibragem, pneu_estado, luzes, ruidos, lixo,
       kit_pneu, acessorios_cabine,
       responsavel, motorista, registrado_por, observacao, foto) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const params = [
        veiculo, oleo, agua, freio, direcao, combustivel,
        pneu_calibragem, pneu_estado, luzes, ruidos, lixo,
        kit_pneu, acessorios_cabine,                      // Novos campos
        responsavel,
        motorista.trim(),                                 // ✅ do formulário
        req.session.user.nome,                            // ✅ quem registrou (logado)
        observacao && observacao.trim() !== "" ? observacao : null,
        foto,
    ];

    db.query(sql, params, (err) => {
        if (err) {
            console.error("Erro ao inserir checklist:", err);
            return res.status(500).send("Erro ao inserir checklist.");
        }
        return res.redirect("/checklist-motoristas");
    });
});

// ROTA POST: EDITAR CHECKLIST
router.post("/checklist-motoristas/editar/:id", uploadChecklist.single("foto"), (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

    const { id } = req.params;

    // Garante que req.body existe
    const {
        veiculo, oleo, agua, freio, direcao, combustivel,
        pneu_calibragem, pneu_estado, luzes, ruidos, lixo,
        kit_pneu, acessorios_cabine, // Novos campos
        responsavel, motorista, observacao,
    } = req.body || {};

    // A MÁGICA AQUI: Salva com o prefixo da pasta
    const novaFoto = req.file ? "veiculos/checklists/" + req.file.filename : null;
    if (novaFoto) {
        db.query(
            "SELECT foto FROM checklists WHERE id = ?",
            [id],
            (errSel, rows) => {
                if (errSel) {
                    console.error("Erro ao buscar checklist para substituir foto:", errSel);
                    return res.status(500).send("Erro ao atualizar checklist.");
                }

                if (rows.length && rows[0].foto) {
                    const fotoAntiga = rows[0].foto;
                    const fs = require('fs');
                    const path = require('path');
                    const caminho = path.join(__dirname, "uploads", fotoAntiga);
                    if (fs.existsSync(caminho)) {
                        fs.unlink(caminho, (errUnlink) => {
                            if (errUnlink) {
                                console.warn("Erro ao remover foto antiga:", errUnlink);
                            }
                        });
                    }
                }

                // Agora atualiza tudo, incluindo a nova foto
                db.query(
                    `UPDATE checklists
           SET veiculo = ?, oleo = ?, agua = ?, freio = ?, direcao = ?, combustivel = ?,
               pneu_calibragem = ?, pneu_estado = ?, luzes = ?, ruidos = ?, lixo = ?,
               kit_pneu = ?, acessorios_cabine = ?,
               responsavel = ?, motorista = ?, observacao = ?, foto = ?
           WHERE id = ?`,
                    [
                        veiculo, oleo, agua, freio, direcao, combustivel,
                        pneu_calibragem, pneu_estado, luzes, ruidos, lixo,
                        kit_pneu, acessorios_cabine,
                        responsavel, motorista,
                        observacao && observacao.trim() !== "" ? observacao : null,
                        novaFoto,
                        id,
                    ],
                    (errUpd) => {
                        if (errUpd) {
                            console.error("Erro ao atualizar checklist (com nova foto):", errUpd);
                            return res.status(500).send("Erro ao atualizar checklist.");
                        }
                        return res.redirect("/checklist-motoristas");
                    }
                );
            }
        );
    } else {
        // Sem nova foto: não mexe na coluna foto
        db.query(
            `UPDATE checklists
       SET veiculo = ?, oleo = ?, agua = ?, freio = ?, direcao = ?, combustivel = ?,
           pneu_calibragem = ?, pneu_estado = ?, luzes = ?, ruidos = ?, lixo = ?,
           kit_pneu = ?, acessorios_cabine = ?,
           responsavel = ?, motorista = ?, observacao = ?
       WHERE id = ?`,
            [
                veiculo, oleo, agua, freio, direcao, combustivel,
                pneu_calibragem, pneu_estado, luzes, ruidos, lixo,
                kit_pneu, acessorios_cabine,
                responsavel, motorista,
                observacao && observacao.trim() !== "" ? observacao : null,
                id,
            ],
            (errUpd) => {
                if (errUpd) {
                    console.error("Erro ao atualizar checklist (sem nova foto):", errUpd);
                    return res.status(500).send("Erro ao atualizar checklist.");
                }
                return res.redirect("/checklist-motoristas");
            }
        );
    }
});

// ROTA POST: EXCLUIR CHECKLIST
router.post("/checklist-motoristas/excluir/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

    const { id } = req.params;

    // Primeiro busca a foto para excluí-la do diretório 'uploads'
    db.query("SELECT foto FROM checklists WHERE id = ?", [id], (errSel, rows) => {
        if (!errSel && rows.length > 0 && rows[0].foto) {
            const fotoAntiga = rows[0].foto;
            const fs = require('fs');
            const path = require('path');
            const caminho = path.join(__dirname, "uploads", fotoAntiga);

            if (fs.existsSync(caminho)) {
                fs.unlink(caminho, (errUnlink) => {
                    if (errUnlink) console.warn("Erro ao remover foto do checklist excluído:", errUnlink);
                });
            }
        }

        // Em seguida, apaga o registro do banco de dados
        db.query("DELETE FROM checklists WHERE id=?", [id], (err) => {
            if (err) {
                console.error("Erro ao excluir checklist:", err);
            }
            res.redirect("/checklist-motoristas");
        });
    });
});

//RELATÓRIO POR CHECKLIST
router.get("/checklist-motoristas/download/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

    const { id } = req.params;

    db.query("SELECT * FROM checklists WHERE id=?", [id], async (err, results) => {
        if (err || results.length === 0) {
            console.error("Erro ao gerar planilha:", err);
            return res.send("Erro ao gerar planilha.");
        }

        const checklist = results[0];

        // Criar planilha
        const ExcelJS = require("exceljs");
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Checklist Motorista");

        sheet.columns = [
            { header: "Campo", key: "campo", width: 30 },
            { header: "Valor", key: "valor", width: 40 }
        ];

        // Preencher linhas
        sheet.addRow({ campo: "Veículo", valor: checklist.veiculo });
        sheet.addRow({ campo: "Nível do óleo", valor: checklist.oleo });
        sheet.addRow({ campo: "Nível da água", valor: checklist.agua });
        sheet.addRow({ campo: "Fluído de freio", valor: checklist.freio });
        sheet.addRow({ campo: "Fluído da direção", valor: checklist.direcao });
        sheet.addRow({ campo: "Combustível", valor: checklist.combustivel });
        sheet.addRow({ campo: "Pneus - Calibragem", valor: checklist.pneu_calibragem });
        sheet.addRow({ campo: "Pneus - Estado", valor: checklist.pneu_estado });
        sheet.addRow({ campo: "Luzes", valor: checklist.luzes });
        sheet.addRow({ campo: "Ruídos anormais", valor: checklist.ruidos });
        sheet.addRow({ campo: "Remoção do lixo interno", valor: checklist.lixo });
        sheet.addRow({ campo: "Responsável logístico", valor: checklist.responsavel });
        sheet.addRow({ campo: "Motorista", valor: checklist.motorista });
        sheet.addRow({ campo: "Registrado por", valor: checklist.registrado_por });
        sheet.addRow({ campo: "Criado em", valor: new Date(checklist.criado_em).toLocaleString("pt-BR") });

        // Definir nome do arquivo: motorista + data download
        const dataAgora = new Date().toLocaleString("pt-BR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }).replace(/[\/:]/g, "-").replace(" ", "_");

        const nomeArquivo = `checklist_${checklist.motorista}_${dataAgora}.xlsx`;

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);

        await workbook.xlsx.write(res);
        res.end();
    });
});

//RELATÓRIO COMPLETO CHECKLIST MOTORISTAS
router.get("/checklist-motoristas/relatorio", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.tipo_usuario !== "admin" &&
        req.session.user.tipo_usuario !== "motorista") {
        return res.status(403).send("Acesso negado.");
    }

    const { motorista, mes, ano } = req.query;

    let where = [];
    let params = [];

    if (motorista) {
        where.push("motorista = ?");
        params.push(motorista);
    }
    if (mes) {
        where.push("MONTH(criado_em) = ?");
        params.push(mes);
    }
    if (ano) {
        where.push("YEAR(criado_em) = ?");
        params.push(ano);
    }

    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

    db.query(`SELECT * FROM checklists ${whereSql} ORDER BY criado_em ASC`, params, async (err, results) => {
        if (err) {
            console.error("Erro ao gerar relatório:", err);
            return res.send("Erro ao gerar relatório.");
        }

        if (results.length === 0) {
            return res.send("<script>alert('Nenhum dado encontrado para os filtros selecionados.'); window.close();</script>");
        }

        const ExcelJS = require("exceljs");
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Relatório Geral");

        // 1. Define as colunas primeiro (gera os cabeçalhos inicialmente na linha 1)
        sheet.columns = [
            { header: "Data/Hora", key: "data", width: 20 },
            { header: "Motorista", key: "motorista", width: 25 },
            { header: "Veículo", key: "veiculo", width: 15 },
            { header: "Nível do óleo", key: "oleo", width: 15 },
            { header: "Nível da água", key: "agua", width: 15 },
            { header: "Fluído de freio", key: "freio", width: 15 },
            { header: "Fluído direção", key: "direcao", width: 15 },
            { header: "Combustível", key: "combustivel", width: 20 },
            { header: "Pneus (Calibragem)", key: "pneu_calibragem", width: 20 },
            { header: "Pneus (Estado)", key: "pneu_estado", width: 20 },
            { header: "Luzes", key: "luzes", width: 20 },
            { header: "Ruídos", key: "ruidos", width: 20 },
            { header: "Lixo", key: "lixo", width: 15 },
            { header: "Responsável", key: "responsavel", width: 20 },
            { header: "Registrado por", key: "registrado_por", width: 20 },
            { header: "Observação", key: "obs", width: 40 }
        ];

        // Formata os cabeçalhos das colunas
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Fonte branca
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0D5749' } // Fundo Verde padrão do sistema
            };
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
            };
        });

        // 2. Adiciona uma nova linha no topo (empurrando o cabeçalho para a linha 2)
        sheet.spliceRows(1, 0, []);

        // 3. Formata e mescla a primeira linha (agora em branco) para o título
        sheet.mergeCells('A1:P1');
        const tituloRow = sheet.getCell('A1');

        // Cria o título dinâmico com Mês e Ano
        const nomesMesesJs = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        let periodoStr = "";
        if (mes && ano) {
            periodoStr = ` - ${nomesMesesJs[parseInt(mes) - 1]} de ${ano}`;
        } else if (mes) {
            periodoStr = ` - ${nomesMesesJs[parseInt(mes) - 1]}`;
        } else if (ano) {
            periodoStr = ` - ${ano}`;
        }

        tituloRow.value = `RELATÓRIO DE CHECKLISTS${periodoStr.toUpperCase()}`;
        tituloRow.alignment = { horizontal: 'center', vertical: 'middle' };
        tituloRow.font = { bold: true, size: 16, color: { argb: 'FF0D5749' } };
        tituloRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF4F7F6' } // Fundo cinza claro
        };
        sheet.getRow(1).height = 35; // Aumenta a altura da linha do título

        // 4. Preencher as linhas de dados com cores diferentes por veículo
        results.forEach(c => {
            const row = sheet.addRow({
                data: new Date(c.criado_em).toLocaleString("pt-BR"),
                motorista: c.motorista || "-",
                veiculo: c.veiculo || "-",
                oleo: c.oleo || "-",
                agua: c.agua || "-",
                freio: c.freio || "-",
                direcao: c.direcao || "-",
                combustivel: c.combustivel || "-",
                pneu_calibragem: c.pneu_calibragem || "-",
                pneu_estado: c.pneu_estado || "-",
                luzes: c.luzes || "-",
                ruidos: c.ruidos || "-",
                lixo: c.lixo || "-",
                responsavel: c.responsavel || "-",
                registrado_por: c.registrado_por || "-",
                obs: c.observacao || ""
            });

            // Determina a cor de fundo com base no veículo
            let corFundo = 'FFFFFFFF'; // Padrão: Branco
            if (c.veiculo === 'Master') {
                corFundo = 'FFE9F2FE'; // Azul Claro
            } else if (c.veiculo === 'Strada') {
                corFundo = 'FFFFF4CC'; // Amarelo Claro
            } else if (c.veiculo === 'Fiorino') {
                corFundo = 'FFFDE2E2'; // Vermelho Claro
            }

            // Aplica o estilo em cada célula da linha inserida
            row.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: corFundo }
                };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                    left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                    bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                    right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            });
        });

        // Nome do arquivo com base no mês escolhido no relatório
        const mesNumero = parseInt(mes, 10);
        let mesNomeArquivo = "Geral";
        if (!isNaN(mesNumero) && mesNumero >= 1 && mesNumero <= 12) {
            mesNomeArquivo = nomesMesesJs[mesNumero - 1];
        }
        const nomeArquivo = `relatorio_checklist_${mesNomeArquivo}.xlsx`;

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);

        await workbook.xlsx.write(res);
        res.end();
    });
});

module.exports = router;