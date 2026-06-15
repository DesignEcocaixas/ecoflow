// views/controlePagamentosView.js
const menuLateral = require("./menuLateral");

function controlePagamentosView(usuario, colaboradores = [], pagamentos = [], cadernos = [], filtros = {}, paginacao = {}, taxas = {}) {
  const user = usuario || { nome: "Usuário", tipo_usuario: "admin" };

  const page = paginacao.page || 1;
  const totalPages = paginacao.totalPages || 1;

  // Número fixo para envio do WhatsApp
  const wppPhone = "557196785385";

  const fmtData = (d) => {
    try {
      if(!d) return "-";
      const dt = new Date(d);
      return new Date(dt.getTime() + Math.abs(dt.getTimezoneOffset() * 60000)).toLocaleDateString("pt-BR");
    } catch {
      return d || "-";
    }
  };

  const fmtDataHora = (d) => {
      try {
          if(!d) return "-";
          const dt = new Date(d);
          return dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
      } catch {
          return d || "-";
      }
  };

  const fmtMoeda = (n) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // FUNÇÃO NO SERVIDOR PARA O CÁLCULO DE DEGRAUS E CÁLCULO DOS CARDS
  const getTierValueNode = (qtd, tipo) => {
      if (qtd <= 0) return 0;
      if (tipo === 'mot') {
          if (qtd <= 6) return taxas.mot_t1 || 80;
          if (qtd <= 9) return taxas.mot_t2 || 95;
          return taxas.mot_t3 || 110;
      } else {
          if (qtd <= 6) return taxas.aju_t1 || 55;
          if (qtd <= 9) return taxas.aju_t2 || 65;
          return taxas.aju_t3 || 75;
      }
  };

  const colaboradoresJson = JSON.stringify(colaboradores.map(c => ({
      id: c.id,
      nome: c.nome,
      tipo_usuario: c.tipo_usuario,
      pix: c.pix || "Não cadastrado",
      cpf: c.cpf || "Não cadastrado",
      banco: c.banco || "Não cadastrado",
      foto: c.foto ? `/uploads/${c.foto}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nome)}&background=0D5749&color=fff`
  })));

  const cadernosSensiveis = JSON.stringify(cadernos.map(c => {
      const cidadesDaRota = c.entregas && c.entregas.length > 0 
          ? [...new Set(c.entregas.map(e => e.cidade).filter(cidade => cidade && cidade.trim() !== ''))].join(', ')
          : '';

      return {
          id: c.id,
          data_formatada: fmtData(c.data_criacao),
          motorista: c.motorista,
          ajudante: c.ajudante,
          qtd_entregas: c.qtd_entregas,
          cidades: cidadesDaRota
      };
  }));

  const opcoesColaboradores = colaboradores.map(c => 
      `<option value="${c.id}">${c.nome} - ${(c.tipo_usuario || '').replace('_', ' ').toUpperCase()}</option>`
  ).join('');

  const getColabData = (nomeBusca) => {
      if (!nomeBusca) return null;
      const colab = colaboradores.find(c => c.nome.toLowerCase() === nomeBusca.toLowerCase().trim());
      if (colab) {
           return {
               ...colab,
               fotoUrl: colab.foto ? `/uploads/${colab.foto}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(colab.nome)}&background=0D5749&color=fff`
           };
      }
      return {
           nome: nomeBusca, id: '', pix: 'Não cadastrado', banco: 'Não cadastrado', cpf: 'Não cadastrado', tipo_usuario: 'motorista',
           fotoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeBusca)}&background=e9ecef&color=6c757d`
      };
  };

  const modaisDetalheRota = [];

  // =========================================================================
  // GERAÇÃO DOS CARDS COM STATUS DE COR E BOTÃO WHATSAPP E MODAL DE DETALHES
  // =========================================================================
  const cardsCadernos = cadernos.length > 0 ? cadernos.map(c => {
      const mot = getColabData(c.motorista);
      const aju = getColabData(c.ajudante);

      // Regra Exigida: Se não for estritamente "motorista_avulso", é considerado Normal (Sem pagamentos avulsos)
      const isMotAvulso = mot.tipo_usuario === 'motorista_avulso';
      const isMotNormal = !isMotAvulso;

      // Histórico Motorista
      const pagMot = pagamentos.find(p => p.caderno_id == c.id && p.colaborador_id == mot.id);
      const isMotPago = c.mot_status === 'PAGO' || (pagMot && pagMot.status === 'PAGO');
      const valorMotCalc = pagMot ? parseFloat(pagMot.valor_total) : getTierValueNode(c.qtd_entregas, 'mot');

      // Histórico Ajudante
      let isAjuPago = true;
      let pagAju = null;
      let valorAjuCalc = 0;
      
      if (c.ajudante && c.ajudante.trim() !== '') {
          pagAju = pagamentos.find(p => p.caderno_id == c.id && p.colaborador_id == aju.id);
          isAjuPago = c.aju_status === 'PAGO' || (pagAju && pagAju.status === 'PAGO');
          valorAjuCalc = pagAju ? parseFloat(pagAju.valor_total) : getTierValueNode(c.qtd_entregas, 'aju');
      }

      let cardBg = "bg-warning bg-opacity-10 border-warning";
      let headerBg = "bg-warning bg-opacity-25 border-bottom border-warning";
      
      // Motoristas fixos são sempre considerados resolvidos para a lógica de cores dos cards
      const motResolvido = isMotNormal || isMotPago;

      if (motResolvido && isAjuPago) {
          cardBg = "bg-success bg-opacity-10 border-success";
          headerBg = "bg-success bg-opacity-25 border-bottom border-success";
      } else if (motResolvido || (c.ajudante && isAjuPago)) {
          cardBg = "bg-info bg-opacity-10 border-info";
          headerBg = "bg-info bg-opacity-25 border-bottom border-info";
      }

      // WhatsApp Motorista Individual (Só útil se for avulso)
      const msgWppMot = `*Pagamento de Serviço (Ecoflow)*\n\n*Colaborador:* ${mot.nome} (Motorista)\n*Data:* ${fmtData(c.data_criacao)}\n*Qtd. Entregas:* ${c.qtd_entregas}\n*Valor a Pagar:* R$ ${fmtMoeda(valorMotCalc)}\n\n*Dados Bancários:*\n*PIX:* ${mot.pix}\n*Banco:* ${mot.banco}\n*CPF:* ${mot.cpf}`;
      const btnWppMot = `<a href="https://wa.me/${wppPhone}?text=${encodeURIComponent(msgWppMot)}" onclick="event.stopPropagation();" target="_blank" class="btn btn-sm btn-light border text-success shadow-sm d-flex align-items-center justify-content-center" style="padding: 2px 6px;" title="Enviar dados para pagamento via WhatsApp"><i class="fa-brands fa-whatsapp" style="font-size: 0.9rem;"></i></a>`;

      const btnMotDisabled = mot.id ? '' : 'disabled';
      const btnMotHtml = isMotPago 
          ? `<button class="btn btn-sm btn-success fw-bold shadow-sm opacity-75" style="font-size: 0.65rem; padding: 2px 8px;" onclick="event.stopPropagation();" disabled><i class="fa-solid fa-check-double me-1"></i> Efetuado</button>`
          : `<button class="btn btn-sm btn-outline-success fw-bold shadow-sm" style="font-size: 0.65rem; padding: 2px 8px;" onclick="event.stopPropagation(); abrirModalPagamento('${mot.id}', ${c.qtd_entregas}, 'motorista', '${c.id}')" ${btnMotDisabled}>Pagar</button>`;

      let motPagamentoBlock = '';
      if (isMotNormal) {
          const btnWppDisabled = `<button disabled class="btn btn-sm btn-light border text-muted shadow-sm d-flex align-items-center justify-content-center" style="padding: 2px 6px; cursor: not-allowed;" title="WhatsApp desabilitado para mensalistas"><i class="fa-brands fa-whatsapp" style="font-size: 0.9rem;"></i></button>`;
          motPagamentoBlock = `
             <div class="text-muted fw-bold text-decoration-line-through" style="font-size:0.8rem; margin-bottom: 2px;">R$ ${fmtMoeda(valorMotCalc)}</div>
             <div class="d-flex gap-1 justify-content-end align-items-center">
                 ${btnWppDisabled}
                 <button class="btn btn-sm btn-outline-secondary fw-bold shadow-sm" style="font-size: 0.65rem; padding: 2px 8px;" disabled>Mensalista</button>
             </div>
          `;
      } else {
          motPagamentoBlock = `
             <div class="text-success fw-bold motorista-calc" data-qtd="${c.qtd_entregas}" data-pago="${isMotPago ? 'true' : 'false'}" data-valor="${valorMotCalc}" style="font-size:0.8rem; margin-bottom: 2px;">R$ ${fmtMoeda(valorMotCalc)}</div>
             <div class="d-flex gap-1 justify-content-end">
                 ${btnWppMot}
                 ${btnMotHtml}
             </div>
          `;
      }

      let htmlAjudante = '';
      if (c.ajudante && c.ajudante.trim() !== '') {
          // WhatsApp Ajudante Individual
          const msgWppAju = `*Pagamento de Serviço (Ecoflow)*\n\n*Colaborador:* ${aju.nome} (Ajudante)\n*Data:* ${fmtData(c.data_criacao)}\n*Qtd. Entregas:* ${c.qtd_entregas}\n*Valor a Pagar:* R$ ${fmtMoeda(valorAjuCalc)}\n\n*Dados Bancários:*\n*PIX:* ${aju.pix}\n*Banco:* ${aju.banco}\n*CPF:* ${aju.cpf}`;
          const btnWppAju = `<a href="https://wa.me/${wppPhone}?text=${encodeURIComponent(msgWppAju)}" onclick="event.stopPropagation();" target="_blank" class="btn btn-sm btn-light border text-success shadow-sm d-flex align-items-center justify-content-center" style="padding: 2px 6px;" title="Enviar dados para pagamento via WhatsApp"><i class="fa-brands fa-whatsapp" style="font-size: 0.9rem;"></i></a>`;

          const btnAjuDisabled = aju.id ? '' : 'disabled';
          const btnAjuHtml = isAjuPago
              ? `<button class="btn btn-sm btn-success fw-bold shadow-sm opacity-75" style="font-size: 0.65rem; padding: 2px 8px;" onclick="event.stopPropagation();" disabled><i class="fa-solid fa-check-double me-1"></i> Efetuado</button>`
              : `<button class="btn btn-sm btn-outline-success fw-bold shadow-sm" style="font-size: 0.65rem; padding: 2px 8px;" onclick="event.stopPropagation(); abrirModalPagamento('${aju.id}', ${c.qtd_entregas}, 'ajudante', '${c.id}')" ${btnAjuDisabled}>Pagar</button>`;

          htmlAjudante = `
             <div class="d-flex align-items-center mt-2 pt-2 border-top">
                 <img src="${aju.fotoUrl}" class="rounded-circle me-2 border shadow-sm" style="width: 32px; height: 32px; object-fit: cover;">
                 <div class="flex-grow-1" style="line-height: 1.1;">
                     <strong class="d-block text-dark text-truncate" style="font-size:0.8rem; max-width: 140px;" title="${aju.nome}">${aju.nome} <span class="badge bg-secondary ms-1" style="font-size:0.55rem;">AJUDANTE</span></strong>
                     <span class="text-muted" style="font-size:0.65rem;"><i class="fa-brands fa-pix text-success"></i> ${aju.pix !== 'Não cadastrado' ? 'PIX' : 'Cadastrar PIX'}</span>
                 </div>
                 <div class="text-end">
                     <div class="text-success fw-bold ajudante-calc" data-qtd="${c.qtd_entregas}" data-pago="${isAjuPago ? 'true' : 'false'}" data-valor="${valorAjuCalc}" style="font-size:0.8rem; margin-bottom: 2px;">R$ ${fmtMoeda(valorAjuCalc)}</div>
                     <div class="d-flex gap-1 justify-content-end">
                         ${btnWppAju}
                         ${btnAjuHtml}
                     </div>
                 </div>
             </div>
          `;
      }

      const listaEntregasHtml = (c.entregas && c.entregas.length > 0) ? c.entregas.map((e, idx) => `
          <div class="border-bottom border-light pb-2 mb-2">
              <div class="fw-bold text-dark d-flex align-items-center mb-1">
                  <span class="badge bg-dark me-2">${idx + 1}</span> 
                  <span style="font-size: 0.9rem;">${e.local_entrega}</span>
                  ${e.cidade ? `<span class="badge bg-info text-dark ms-2" style="font-size: 0.65rem;">${e.cidade}</span>` : ''}
              </div>
              <div class="text-muted ms-4 ps-2" style="font-size: 0.8rem;">
                  <div class="mb-1"><i class="fa-solid fa-box-open me-1 opacity-75"></i> <strong>Itens:</strong> ${e.itens_pedido || 'Não especificado'}</div>
                  <div><i class="fa-solid fa-cubes me-1 opacity-75"></i> <strong>Qtd:</strong> ${e.quantidade || '-'}</div>
              </div>
          </div>
      `).join('') : '<div class="text-muted small p-2 text-center">Nenhuma entrega detalhada encontrada para esta rota.</div>';

      modaisDetalheRota.push(`
        <div class="modal fade" id="detalheRotaModal${c.id}" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content erp-modal shadow-lg border-0 bg-light">
                    <div class="modal-header bg-white shadow-sm" style="z-index: 10;">
                        <div>
                            <h6 class="modal-title fw-bold text-dark mb-0"><i class="fa-solid fa-route text-primary me-2"></i> Detalhes da Rota #${c.id}</h6>
                            <span class="text-muted" style="font-size:0.8rem;"><i class="fa-regular fa-calendar-check me-1"></i> ${fmtDataHora(c.data_criacao)}</span>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <h6 class="fw-bold text-muted mb-2" style="font-size: 0.8rem; text-transform: uppercase;">Equipe & Transporte</h6>
                        <div class="row g-3 mb-4">
                            <div class="col-12 col-md-4">
                                <div class="p-3 bg-white border border-light rounded shadow-sm h-100 d-flex align-items-center">
                                    <img src="${mot.fotoUrl}" class="rounded-circle me-3 border shadow-sm" style="width: 40px; height: 40px; object-fit: cover;">
                                    <div>
                                        <span class="text-muted d-block mb-1" style="font-size: 0.7rem; line-height: 1;">Motorista</span>
                                        <strong class="text-dark d-block text-truncate" style="font-size: 0.85rem; max-width: 130px;" title="${mot.nome}">${mot.nome}</strong>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 col-md-4">
                                <div class="p-3 bg-white border border-light rounded shadow-sm h-100 d-flex align-items-center">
                                    <img src="${c.ajudante ? aju.fotoUrl : 'https://ui-avatars.com/api/?name=Ajudante&background=e9ecef&color=6c757d'}" class="rounded-circle me-3 border shadow-sm" style="width: 40px; height: 40px; object-fit: cover;">
                                    <div>
                                        <span class="text-muted d-block mb-1" style="font-size: 0.7rem; line-height: 1;">Ajudante</span>
                                        <strong class="text-dark d-block text-truncate" style="font-size: 0.85rem; max-width: 130px;" title="${c.ajudante || 'Nenhum'}">${c.ajudante || 'Nenhum'}</strong>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 col-md-4">
                                <div class="p-3 bg-white border border-light rounded shadow-sm h-100 d-flex align-items-center">
                                    <div class="rounded-circle bg-light border d-flex justify-content-center align-items-center me-3 shadow-sm" style="width: 40px; height: 40px;">
                                        <i class="fa-solid fa-car text-muted"></i>
                                    </div>
                                    <div>
                                        <span class="text-muted d-block mb-1" style="font-size: 0.7rem; line-height: 1;">Veículo Utilizado</span>
                                        <strong class="text-dark d-block text-truncate" style="font-size: 0.85rem; max-width: 130px;" title="${c.veiculo_modelo || 'Não informado'}">${c.veiculo_modelo || 'Não informado'}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h6 class="fw-bold text-muted mb-2 mt-2" style="font-size: 0.8rem; text-transform: uppercase;">Progresso & Clientes</h6>
                        <div class="bg-white p-3 border border-light rounded shadow-sm">
                            <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                                <span class="fw-bold text-dark"><i class="fa-solid fa-map-location-dot text-primary me-1"></i> Destinos da Rota</span>
                                <span class="badge bg-primary bg-opacity-10 text-primary border border-primary">${c.qtd_entregas} Locais</span>
                            </div>
                            ${listaEntregasHtml}
                        </div>
                    </div>
                    <div class="modal-footer bg-white border-top">
                        <button type="button" class="btn btn-sm btn-secondary px-4 fw-bold" data-bs-dismiss="modal">Fechar Detalhes</button>
                    </div>
                </div>
            </div>
        </div>
      `);

      return `
         <div class="col-12 col-md-6 col-xl-4 caderno-card-item">
             <div class="card erp-card shadow-sm h-100 ${cardBg}" style="cursor: pointer;" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('detalheRotaModal${c.id}')).show();" title="Clique para ver os locais de entrega e detalhes do caderno">
                 <div class="card-header p-2 d-flex justify-content-between align-items-center ${headerBg}">
                     <div>
                         <h6 class="fw-bold text-dark mb-0" style="font-size:0.8rem;"><i class="fa-solid fa-book-open-reader text-primary me-1"></i> Rota #${c.id}</h6>
                         <span class="text-muted" style="font-size:0.65rem;">${fmtDataHora(c.data_criacao)}</span>
                     </div>
                     <span class="badge bg-dark bg-opacity-75 text-white border border-dark px-2 py-1" style="font-size: 0.7rem;"><i class="fa-solid fa-box-open me-1"></i> ${c.qtd_entregas} Locais</span>
                 </div>
                 <div class="card-body p-2">
                     <div class="d-flex align-items-center">
                         <img src="${mot.fotoUrl}" class="rounded-circle me-2 border shadow-sm" style="width: 32px; height: 32px; object-fit: cover;">
                         <div class="flex-grow-1" style="line-height: 1.1;">
                             <strong class="d-block text-dark text-truncate" style="font-size:0.8rem; max-width: 140px;" title="${mot.nome}">${mot.nome} <span class="badge bg-primary ms-1" style="font-size:0.55rem;">MOTORISTA</span></strong>
                             ${isMotNormal ? '' : `<span class="text-muted" style="font-size:0.65rem;"><i class="fa-brands fa-pix text-success"></i> ${mot.pix !== 'Não cadastrado' ? 'PIX' : 'Cadastrar PIX'}</span>`}
                         </div>
                         <div class="text-end">
                             ${motPagamentoBlock}
                         </div>
                     </div>
                     ${htmlAjudante}
                 </div>
             </div>
         </div>
      `;
  }).join('') : `<div class="col-12 text-center text-muted py-4"><i class="fa-solid fa-check-double fa-3x opacity-25 mb-3"></i><p>Nenhum caderno no período selecionado.</p></div>`;


  const modaisDinamicosExcluir = [];

  const linhasPagamentos = pagamentos.length > 0 ? pagamentos.map(p => {
      const colab = colaboradores.find(c => c.id === p.colaborador_id) || {};
      const foto = colab.foto ? `/uploads/${colab.foto}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome_colaborador || 'C')}&background=0D5749&color=fff`;
      
      let badgeStatus = p.status === 'PAGO' 
        ? '<span class="badge bg-success bg-opacity-10 text-success border border-success"><i class="fa-solid fa-check-double"></i> Pago</span>' 
        : '<span class="badge bg-warning bg-opacity-10 text-dark border border-warning"><i class="fa-solid fa-clock"></i> Pendente</span>';

      const extratoViagem = p.tipo_viagem && p.tipo_viagem !== 'Padrão' ? `\n*Destino Longo:* ${p.tipo_viagem}` : '';
      const extratoAlmoco = p.almoco > 0 ? `\n*Almoço:* R$ ${fmtMoeda(p.almoco)}` : '';

      const msgWppHist = `Relatório de Pagamento - Ecoflow\n\n[ Data do Serviço: ${fmtData(p.data_servico)} ]\n* Colaborador: ${p.nome_colaborador} (${(p.tipo_colaborador || '').replace('_', ' ').toUpperCase()})\n* Qtd. Entregas: ${p.qtd_entregas}${extratoViagem}${extratoAlmoco}\n\n* TOTAL A PAGAR: R$ ${fmtMoeda(p.valor_total)}\n\n* PIX: ${colab.pix || 'Não cadastrado'} (${colab.banco || 'Não cadastrado'})`;
      const btnWppHist = `<a href="https://wa.me/${wppPhone}?text=${encodeURIComponent(msgWppHist)}" target="_blank" class="btn btn-sm btn-light border text-success shadow-sm ms-1" title="Enviar dados para pagamento via WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>`;

      modaisDinamicosExcluir.push(`
        <div class="modal fade" id="excluirPagamentoModal${p.id}" tabindex="-1">
            <div class="modal-dialog modal-sm modal-dialog-centered">
                <form method="POST" action="/pagamentos/excluir/${p.id}" class="modal-content border-0 shadow-lg erp-modal" onsubmit="prepararSubmissaoSimples(event, this, 'Registo Excluído!')">
                    <div class="modal-body p-4 text-center">
                        <i class="fa-solid fa-triangle-exclamation fa-3x text-danger mb-3"></i>
                        <h6 class="fw-bold text-dark mb-2">Excluir Registo?</h6>
                        <p class="text-muted mb-0" style="font-size:0.85rem;">Tem certeza que deseja apagar este pagamento de <b>${p.nome_colaborador}</b>?</p>
                    </div>
                    <div class="modal-footer bg-light border-0 justify-content-center d-flex flex-nowrap">
                        <button type="button" class="btn btn-sm btn-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-sm btn-danger w-100 fw-bold">Excluir</button>
                    </div>
                </form>
            </div>
        </div>
      `);

      return `
        <tr class="align-middle table-hover-row">
            <td class="py-3 px-3">
                <div class="d-flex align-items-center">
                    <img src="${foto}" alt="Foto" class="rounded-circle me-3 border shadow-sm" style="width: 40px; height: 40px; object-fit: cover;">
                    <div>
                        <strong class="text-dark d-block" style="font-size:0.9rem;">${p.nome_colaborador}</strong>
                        <span class="text-muted" style="font-size:0.75rem;">${(p.tipo_colaborador || '').replace('_', ' ').toUpperCase()}</span>
                    </div>
                </div>
            </td>
            <td class="text-muted py-3 px-3 fw-medium"><i class="fa-regular fa-calendar me-1"></i> ${fmtData(p.data_servico)}</td>
            <td class="py-3 px-3 text-center">
                <span class="badge bg-light text-dark border shadow-sm" style="font-size:0.8rem;"><i class="fa-solid fa-box-open text-primary me-1"></i> ${p.qtd_entregas}</span>
            </td>
            <td class="text-success fw-bold py-3 px-3" style="font-size:0.95rem;">R$ ${fmtMoeda(p.valor_total)}</td>
            <td class="py-3 px-3 text-center">${badgeStatus}</td>
            <td class="text-end py-3 px-3 text-nowrap">
                ${p.comprovante ? `
                    <a href="/uploads/${p.comprovante}" target="_blank" class="btn btn-sm btn-light border text-info shadow-sm" title="Ver Comprovante"><i class="fa-solid fa-file-invoice"></i></a>
                ` : ''}
                ${p.status === 'Pendente' ? `
                <form method="POST" action="/pagamentos/baixar/${p.id}" class="d-inline" onsubmit="prepararSubmissaoSimples(event, this, 'Pagamento Efetivado!')">
                    <button type="submit" class="btn btn-sm btn-success shadow-sm fw-bold ms-1" title="Marcar como Pago"><i class="fa-solid fa-check me-1"></i> Pagar</button>
                </form>
                ` : ''}
                ${btnWppHist}
                <button type="button" class="btn btn-sm btn-light border text-danger shadow-sm ms-1" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('excluirPagamentoModal${p.id}')).show();" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
      `;
  }).join('') : `<tr><td colspan="6" class="text-center text-muted py-5 text-center-empty"><i class="fa-solid fa-file-invoice-dollar fa-3x opacity-25 mb-3"></i><p>Nenhum registo de pagamento encontrado no histórico.</p></td></tr>`;

  // Paginação Inteligente (Sliding Window)
  const qsParams = [];
  if (filtros.data_inicio) qsParams.push(`data_inicio=${filtros.data_inicio}`);
  if (filtros.data_fim) qsParams.push(`data_fim=${filtros.data_fim}`);
  if (filtros.colaborador) qsParams.push(`colaborador=${filtros.colaborador}`);
  if (filtros.caderno_inicio) qsParams.push(`caderno_inicio=${filtros.caderno_inicio}`);
  if (filtros.caderno_fim) qsParams.push(`caderno_fim=${filtros.caderno_fim}`);
  const baseQueryString = qsParams.length > 0 ? '&' + qsParams.join('&') : '';

  const paginacaoHtml = (() => {
      if (totalPages <= 1) return "";
      let html = `<nav class="mt-4"><ul class="pagination pagination-sm justify-content-center mb-4">`;
      html += `<li class="page-item ${page <= 1 ? "disabled" : ""}"><a class="page-link text-dark" href="/pagamentos?page=${page - 1}${baseQueryString}" onclick="navegarPagina(event, this.href)">«</a></li>`;
      
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);
      
      if (start > 1) {
          html += `<li class="page-item"><a class="page-link text-dark" href="/pagamentos?page=1${baseQueryString}" onclick="navegarPagina(event, this.href)">1</a></li>`;
          if (start > 2) html += `<li class="page-item disabled"><span class="page-link text-muted">...</span></li>`;
      }
      for (let i = start; i <= end; i++) {
        html += `<li class="page-item ${i === page ? "active" : ""}"><a class="page-link ${i === page ? "fw-bold text-white bg-success border-success" : "text-dark"}" href="/pagamentos?page=${i}${baseQueryString}" onclick="navegarPagina(event, this.href)">${i}</a></li>`;
      }
      if (end < totalPages) {
          if (end < totalPages - 1) html += `<li class="page-item disabled"><span class="page-link text-muted">...</span></li>`;
          html += `<li class="page-item"><a class="page-link text-dark" href="/pagamentos?page=${totalPages}${baseQueryString}" onclick="navegarPagina(event, this.href)">${totalPages}</a></li>`;
      }
      
      html += `<li class="page-item ${page >= totalPages ? "disabled" : ""}"><a class="page-link text-dark" href="/pagamentos?page=${page + 1}${baseQueryString}" onclick="navegarPagina(event, this.href)">»</a></li>`;
      html += `</ul></nav>`;
      return html;
  })();

  const menuHTML = menuLateral(user, "/pagamentos");

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Controle de Pagamentos | ERP Ecoflow</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
    <style>
      body { display: flex; height: 100vh; margin: 0; background-color: #f4f7f6; font-family: 'Segoe UI', sans-serif; }
      .sidebar { width: 240px; background-color: #0D5749; color: white; padding: 20px; display: flex; flex-direction: column;}
      .sidebar a { display: block; padding: 10px 15px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 8px; margin-bottom: 5px; font-size: 0.9rem; transition: all 0.2s;}
      .sidebar a:hover, .sidebar a.active { background-color: rgba(255,255,255,0.1); color: #fff; }
      .content { flex: 1; padding: 24px; overflow-y: auto; position: relative; }
      .erp-modal { border-radius: 12px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
      .table-hover-row { transition: background-color 0.2s; }
      .table-hover-row:hover > td { background-color: rgba(13, 87, 73, 0.06) !important; }
      
      .erp-card { transition: all 0.3s ease; border-radius: 12px; border-width: 2px !important; }

      .colab-preview-card { transition: all 0.3s ease; border: 2px solid transparent; }
      .colab-preview-card img { border: 3px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
      .colab-preview-card.card-pago {
          background-color: rgba(25, 135, 84, 0.08) !important;
          border-color: #198754 !important;
      }

      .toast { transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease !important; }
      .toast.showing, .toast.show { transform: translateX(0); }
      .toast-timer { height: 6px; background: rgba(255, 255, 255, 0.4); width: 100%; position: absolute; bottom: 0; left: 0; transform-origin: left; }
      @keyframes shrinkToast { from { width: 100%; } to { width: 0%; } }

      .skeleton-view { background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%); background-size: 200% 100%; animation: skeleton-loading-view 1.5s infinite linear; border-radius: 4px; }
      .skeleton-text-view { height: 16px; width: 100%; margin-bottom: 8px; }
      .skeleton-avatar-view { height: 40px; width: 40px; border-radius: 50%; }
      @keyframes skeleton-loading-view { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

      @media (max-width: 767.98px) {
        body { flex-direction: column; }
        .sidebar { display: none; }
        .content { width: 100%; padding: 16px; }
      }
    </style>
  </head>
  <body>

    <div class="sidebar d-none d-md-flex">
      <div class="text-center mb-4 mt-2"><img src="/img/logo-branca.png" class="img-fluid" style="max-width:130px;"></div>
      <div class="flex-grow-1">${menuHTML}</div>
    </div>

    <div class="offcanvas offcanvas-start bg-dark text-white" tabindex="-1" id="sidebarMenu">
      <div class="offcanvas-header border-bottom border-secondary">
        <h5 class="offcanvas-title ms-2"><i class="fa-solid fa-bars text-muted me-2"></i> Menu</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <div class="text-center mb-4 mt-2"><img src="/img/logo.png" class="img-fluid" style="max-width:140px;"></div>
        ${menuHTML}
      </div>
    </div>

    <div class="content">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-light border d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu"><i class="fa-solid fa-bars"></i></button>
            <div>
              <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-hand-holding-dollar text-muted me-2"></i>Controle de Pagamentos</h4>
              <span class="text-muted d-none d-sm-block mt-1" style="font-size:0.75rem;">Registo de diárias e entregas de colaboradores avulsos</span>
            </div>
        </div>
      </div>

      <div class="bg-white p-3 rounded-3 shadow-sm border border-light mb-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
         <h6 class="fw-bold text-dark mb-0 text-nowrap"><i class="fa-solid fa-route text-primary me-2"></i> Rotas / Serviços</h6>
         
         <div class="d-flex flex-wrap align-items-center gap-3 justify-content-md-end">
            <form id="formFiltroCadernos" class="d-flex align-items-center mb-0 gap-2" method="GET" action="/pagamentos" onsubmit="prepararBuscaSimples(event, this, 'Filtros Aplicados!')">
                <div class="input-group input-group-sm shadow-sm" style="flex-wrap: nowrap; width: auto;">
                    <span class="input-group-text bg-light text-muted d-none d-sm-block"><i class="fa-regular fa-calendar"></i></span>
                    <input type="date" name="caderno_inicio" class="form-control" value="${filtros.caderno_inicio || ''}" title="Data Inicial Rotas" style="max-width: 130px;">
                    <span class="input-group-text bg-light text-muted">até</span>
                    <input type="date" name="caderno_fim" class="form-control" value="${filtros.caderno_fim || ''}" title="Data Final Rotas" style="max-width: 130px;">
                    <button type="submit" class="btn btn-primary px-3" title="Filtrar Rotas"><i class="fa-solid fa-filter"></i></button>
                    <button type="button" class="btn btn-light border px-2 text-danger" onclick="limparFiltrosCadernos()" title="Limpar Filtro de Rotas"><i class="fa-solid fa-eraser"></i></button>
                </div>
            </form>

            <div class="vr d-none d-md-block mx-1"></div>

            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-success fw-bold shadow-sm px-3" onclick="bootstrap.Modal.getOrCreateInstance(document.getElementById('modalMensagemPeriodo')).show();" title="Mensagem do Período (WhatsApp)">
                   <i class="fa-brands fa-whatsapp fs-6"></i> <span class="d-none d-sm-inline ms-1">Gerar pagamentos</span>
                </button>
                <button class="btn btn-sm btn-outline-dark fw-bold shadow-sm bg-white px-3" data-bs-toggle="modal" data-bs-target="#modalConfigTaxas" title="Configurar Diárias">
                   <i class="fa-solid fa-gear fs-6"></i> <span class="d-none d-sm-inline ms-1">Valores</span>
                </button>
            </div>
         </div>
      </div>

      <div class="row g-3" id="cadernosGrid">
         ${cardsCadernos}
      </div>
      <div id="paginationCadernos" class="d-flex justify-content-center mt-4 mb-5"></div>

      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 border-top pt-4">
         <h6 class="fw-bold text-dark mb-0"><i class="fa-solid fa-clock-rotate-left text-success me-2"></i> Histórico de Pagamentos Lançados</h6>
         <div class="d-flex gap-2 flex-wrap">
            <form id="formFiltro" class="d-flex gap-2 flex-wrap" method="GET" action="/pagamentos" onsubmit="prepararBuscaSimples(event, this, 'Filtros Aplicados!')">
                <div><input type="date" name="data_inicio" class="form-control form-control-sm" value="${filtros.data_inicio || ''}" title="Data Inicial"></div>
                <div><input type="date" name="data_fim" class="form-control form-control-sm" value="${filtros.data_fim || ''}" title="Data Final"></div>
                <button type="submit" class="btn btn-sm btn-outline-primary"><i class="fa-solid fa-filter"></i></button>
                <button type="button" class="btn btn-sm btn-light border" onclick="limparFiltros()"><i class="fa-solid fa-eraser"></i></button>
            </form>
            <button class="btn btn-sm btn-success px-4 shadow-sm fw-bold" onclick="abrirModalPagamento('', 0, 'motorista', '')">
              <i class="fa-solid fa-plus-circle me-1"></i> Lançamento Avulso
            </button>
         </div>
      </div>

      <div class="table-responsive bg-white rounded-3 shadow-sm border border-light mb-4" id="tabelaContainer">
         <table class="table table-hover align-middle mb-0" style="font-size: 0.85rem;">
           <thead class="table-light">
             <tr>
               <th class="py-2 px-3 fw-bold text-muted border-0">Colaborador</th>
               <th class="py-2 px-3 fw-bold text-muted border-0">Data do Serviço</th>
               <th class="py-2 px-3 fw-bold text-muted border-0 text-center">Entregas</th>
               <th class="py-2 px-3 fw-bold text-muted border-0">Valor Total</th>
               <th class="py-2 px-3 fw-bold text-muted border-0 text-center">Status</th>
               <th class="py-2 px-3 fw-bold text-muted border-0 text-end">Ações</th>
             </tr>
           </thead>
           <tbody class="border-top-0">
             ${linhasPagamentos}
           </tbody>
         </table>
      </div>

      ${paginacaoHtml}
    </div>

    <div class="modal fade" id="modalMensagemPeriodo" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content erp-modal shadow-lg">
                <div class="modal-header bg-success text-white border-0">
                    <h6 class="modal-title fw-bold"><i class="fa-brands fa-whatsapp me-2"></i> Relatório do Período</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4 bg-light text-center">
                    <i class="fa-solid fa-file-invoice-dollar fa-3x text-success mb-3"></i>
                    <h6 class="fw-bold text-dark">Gerar Relatório Geral</h6>
                    <p class="text-muted" style="font-size: 0.8rem; line-height: 1.4;">
                        O sistema irá varrer <strong>todas as rotas</strong> listadas no período filtrado e organizar os colaboradores avulsos por data, calculando os valores totais e gerando a mensagem para pagamento.
                    </p>
                </div>
                <div class="modal-footer bg-white border-0 p-3">
                    <button class="btn btn-sm btn-success w-100 fw-bold shadow-sm" onclick="dispararMensagemPeriodo()"><i class="fa-solid fa-paper-plane me-1"></i> Gerar Link WhatsApp</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalConfigTaxas" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <form method="POST" action="/configuracoes/taxas" class="modal-content erp-modal shadow-lg" onsubmit="prepararSubmissaoSimples(event, this, 'Taxas Salvas no Banco!')">
          <div class="modal-header bg-dark text-white border-0">
            <h6 class="modal-title fw-bold"><i class="fa-solid fa-gear me-2"></i> Configurar Diárias e Adicionais</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-light" style="max-height: 70vh; overflow-y: auto;">
            
            <h6 class="fw-bold text-primary border-bottom pb-2 mb-3" style="font-size: 0.85rem;">Valor Motoristas</h6>
            <div class="row g-2 mb-4">
                <div class="col-4">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">1 a 6 Entregas</label>
                    <input type="number" step="0.01" name="mot_t1" class="form-control form-control-sm text-center shadow-sm" value="${taxas.mot_t1 || 80.00}" required>
                </div>
                <div class="col-4">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">7 a 9 Entregas</label>
                    <input type="number" step="0.01" name="mot_t2" class="form-control form-control-sm text-center shadow-sm" value="${taxas.mot_t2 || 95.00}" required>
                </div>
                <div class="col-4">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">10 a 15 Entregas</label>
                    <input type="number" step="0.01" name="mot_t3" class="form-control form-control-sm text-center shadow-sm" value="${taxas.mot_t3 || 110.00}" required>
                </div>
            </div>

            <h6 class="fw-bold text-success border-bottom pb-2 mb-3" style="font-size: 0.85rem;">Valor Ajudantes</h6>
            <div class="row g-2 mb-4">
                <div class="col-4">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">1 a 6 Entregas</label>
                    <input type="number" step="0.01" name="aju_t1" class="form-control form-control-sm text-center shadow-sm" value="${taxas.aju_t1 || 55.00}" required>
                </div>
                <div class="col-4">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">7 a 9 Entregas</label>
                    <input type="number" step="0.01" name="aju_t2" class="form-control form-control-sm text-center shadow-sm" value="${taxas.aju_t2 || 65.00}" required>
                </div>
                <div class="col-4">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">10 a 15 Entregas</label>
                    <input type="number" step="0.01" name="aju_t3" class="form-control form-control-sm text-center shadow-sm" value="${taxas.aju_t3 || 75.00}" required>
                </div>
            </div>

            <h6 class="fw-bold text-danger border-bottom pb-2 mb-3" style="font-size: 0.85rem;">Valor viagens longas</h6>
            <div class="row g-2">
                <div class="col-6">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Sul da Bahia</label>
                    <input type="number" step="0.01" name="vl_sulbahia" class="form-control form-control-sm text-center shadow-sm" value="${taxas.vl_sulbahia || 200.00}" required>
                </div>
                <div class="col-6">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Aracaju</label>
                    <input type="number" step="0.01" name="vl_aracaju1" class="form-control form-control-sm text-center shadow-sm" value="${taxas.vl_aracaju1 || 160.00}" required>
                </div>
                <div class="col-6">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Aracaju</label>
                    <input type="number" step="0.01" name="vl_aracaju2" class="form-control form-control-sm text-center shadow-sm" value="${taxas.vl_aracaju2 || 200.00}" required>
                </div>
                <div class="col-6">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Capim Grosso</label>
                    <input type="number" step="0.01" name="vl_capimgrosso" class="form-control form-control-sm text-center shadow-sm" value="${taxas.vl_capimgrosso || 200.00}" required>
                </div>
                <div class="col-12 mt-3">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.75rem;">Valor Almoço (R$)</label>
                    <input type="number" step="0.01" name="val_almoco" id="inputValorAlmocoBase" class="form-control form-control-sm shadow-sm" value="${taxas.val_almoco || 25.00}" required>
                </div>
            </div>

          </div>
          <div class="modal-footer bg-white border-0 d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-sm btn-success w-100 fw-bold shadow-sm">Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal fade" id="novoPagamentoModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <form method="POST" action="/pagamentos/novo" enctype="multipart/form-data" class="modal-content erp-modal shadow-lg" onsubmit="prepararSubmissaoSimples(event, this, 'Pagamento Registrado!')">
          <input type="hidden" name="caderno_id" id="cadernoIdInput" value="">
          <input type="hidden" id="tipoColabOculto" value="">
          
          <div class="modal-header bg-success border-0 text-white">
            <h6 class="modal-title fw-bold"><i class="fa-solid fa-hand-holding-dollar me-2"></i> Lançar Diária / Entregas</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-light">
            
            <div class="mb-3">
                <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Selecione o Colaborador</label>
                <select name="colaborador_id" id="selectColaborador" class="form-select shadow-sm" required onchange="atualizarPreviewColab()">
                    <option value="" selected disabled>Escolha na lista...</option>
                    ${opcoesColaboradores}
                </select>
            </div>

            <div id="previewCard" class="colab-preview-card bg-white p-3 rounded border border-light shadow-sm mb-4 d-none">
                <div class="d-flex align-items-center">
                    <img id="prevFoto" src="" alt="Foto" class="rounded-circle me-3" style="width: 55px; height: 55px; object-fit: cover;">
                    <div>
                        <h6 id="prevNome" class="fw-bold text-dark mb-0 fs-6">Nome</h6>
                        <span id="prevTipo" class="badge bg-secondary mb-1 mt-1" style="font-size:0.65rem;">TIPO</span>
                    </div>
                </div>
                <div class="mt-3 pt-2 border-top row g-2 text-muted" style="font-size:0.75rem;">
                    <div class="col-6"><strong><i class="fa-solid fa-id-card"></i> CPF:</strong> <span id="prevCpf"></span></div>
                    <div class="col-6"><strong><i class="fa-solid fa-building-columns"></i> Banco:</strong> <span id="prevBanco"></span></div>
                    <div class="col-12 text-success fw-bold"><strong><i class="fa-brands fa-pix"></i> PIX:</strong> <span id="prevPix"></span></div>
                </div>
            </div>

            <div class="row g-3 bg-white p-3 rounded border border-light shadow-sm">
                <div class="col-12">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Data</label>
                    <input type="date" name="data_servico" class="form-control form-control-sm" required value="${new Date().toISOString().split('T')[0]}">
                </div>
                
                <div class="col-12 border-top pt-2">
                    <h6 class="fw-bold text-primary mb-2" style="font-size: 0.8rem;">Cálculo do Serviço</h6>
                    
                    <div id="containerViagemLonga" style="display: none;">
                        <div class="form-check form-switch mb-2">
                            <input class="form-check-input" type="checkbox" name="is_viagem_longa" id="switchViagemLonga" value="sim" onchange="toggleViagemLonga(this)">
                            <label class="form-check-label fw-bold text-danger" for="switchViagemLonga" style="font-size:0.8rem;">Marcar como Viagem Longa</label>
                        </div>
                        <div class="mb-3 d-none" id="divDestinoLonga">
                            <select name="destino_longa" id="selectDestinoLonga" class="form-select form-select-sm shadow-sm" onchange="calcularValor()">
                                <option value="sulbahia">Sul da Bahia (R$ ${fmtMoeda(taxas.vl_sulbahia)})</option>
                                <option value="aracaju1">Aracaju (R$ ${fmtMoeda(taxas.vl_aracaju1)})</option>
                                <option value="aracaju2">Aracaju Extra (R$ ${fmtMoeda(taxas.vl_aracaju2)})</option>
                                <option value="capimgrosso">Capim Grosso (R$ ${fmtMoeda(taxas.vl_capimgrosso)})</option>
                            </select>
                        </div>
                    </div>

                    <div class="mb-3" id="divQtdEntregas">
                        <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;">Qtd. Entregas</label>
                        <input type="number" name="qtd_entregas" id="qtdEntregas" class="form-control form-control-sm text-center fw-bold" value="0" min="0" oninput="calcularValor()">
                        <div class="form-text" style="font-size: 0.7rem;">A quantidade será enviada ao histórico de rota, mesmo se marcada Viagem Longa.</div>
                    </div>

                    <div class="form-check form-switch mt-2">
                        <input class="form-check-input" type="checkbox" name="is_almoco" id="switchAlmoco" value="sim" onchange="toggleAlmoco()">
                        <label class="form-check-label fw-bold text-dark" for="switchAlmoco" style="font-size:0.8rem;">Adicionar Almoço (R$ ${fmtMoeda(taxas.val_almoco)})</label>
                        <input type="hidden" name="valor_almoco_bd" id="valorAlmocoOculto" value="${taxas.val_almoco}">
                    </div>
                </div>
                
                <div class="col-12 mt-3 pt-3 border-top text-center">
                    <span class="text-muted d-block mb-1" style="font-size:0.8rem;">Valor Total a Pagar</span>
                    <h3 class="fw-bold text-success mb-0" id="valorTotalVisor">R$ 0,00</h3>
                    <input type="hidden" name="valor_total" id="valorTotalInput" value="0.00">
                </div>
                
                <div class="col-12 mt-2 text-center pt-2">
                    <div class="form-check form-switch d-inline-block">
                        <input class="form-check-input" type="checkbox" name="ja_pago" id="jaPagoSwitch" value="sim" onchange="togglePagoState(this)">
                        <label class="form-check-label fw-bold text-dark" for="jaPagoSwitch" style="font-size:0.85rem;">Já efetuei o pagamento (PIX)</label>
                    </div>
                </div>

                <div class="col-12 mt-3 p-3 bg-light rounded border" id="comprovanteContainer" style="opacity: 0.4; pointer-events: none; transition: all 0.3s ease; transform: translateY(-5px);">
                    <label class="form-label text-muted fw-bold mb-1" style="font-size:0.8rem;"><i class="fa-solid fa-paperclip me-1"></i> Anexar Comprovante</label>
                    <input type="file" name="comprovante" id="fileComprovante" class="form-control form-control-sm shadow-sm" accept="image/*,.pdf">
                    <div class="form-text" style="font-size: 0.7rem;">Obrigatório ativar a chave acima para anexar ficheiro.</div>
                </div>
            </div>

          </div>
          <div class="modal-footer border-0 bg-white d-flex flex-nowrap">
            <button type="button" class="btn btn-sm btn-outline-secondary w-100" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" id="btnSubmitPagamento" class="btn btn-sm btn-primary w-100 fw-bold"><i class="fa-solid fa-save me-1"></i> Lançar ao Histórico</button>
          </div>
        </form>
      </div>
    </div>

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 2050;">
        <div id="sucessoToast" class="toast shadow-lg border-0 bg-success text-white overflow-hidden position-relative" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-check fs-5 me-2" id="sucessoIcon"></i>
                    <strong class="fs-6" id="sucessoTitulo">Concluído!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white mb-0" style="font-size:0.9rem; opacity: 0.9;" id="sucessoSub">Operação realizada com sucesso.</p>
            </div>
            <div class="toast-timer position-absolute bottom-0 start-0" id="sucessoTimer" style="display: none; height: 6px;"></div>
        </div>

        <div id="erroToast" class="toast shadow-lg border-0 bg-danger text-white overflow-hidden position-relative" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-transparent border-bottom-0 pb-0 pt-3 px-3 text-white d-flex justify-content-between">
                <div>
                    <i class="fa-solid fa-circle-xmark fs-5 me-2"></i>
                    <strong class="fs-6" id="erroTitulo">Erro!</strong>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body pt-1 pb-4 px-3 position-relative">
                <p class="text-white mb-0" style="font-size:0.9rem; opacity: 0.9;" id="erroSub">Ocorreu um erro ao processar.</p>
            </div>
            <div class="toast-timer position-absolute bottom-0 start-0" id="erroTimer" style="display: none; height: 6px;"></div>
        </div>
    </div>

    ${modaisDinamicosExcluir.join('')}
    ${modaisDetalheRota.join('')}

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./script/checkLogin.js"></script>

    <script>
      const listaDB = ${colaboradoresJson};
      const NUMERO_WPP = "${wppPhone}";
      const TAXAS = ${JSON.stringify(taxas)};

      // =======================================================================
      // LÓGICA DE PAGINAÇÃO DOS CARDS DE CADERNOS
      // =======================================================================
      let currentPageCadernos = 1;
      const itemsPerPageCadernos = 6;
      
      function renderCadernosPage(page) {
          const items = document.querySelectorAll('.caderno-card-item');
          if(items.length === 0) return;
          
          const totalPages = Math.ceil(items.length / itemsPerPageCadernos);
          if(page < 1) page = 1;
          if(page > totalPages) page = totalPages;
          currentPageCadernos = page;

          items.forEach((item, index) => {
              item.style.display = 'none';
              if (index >= (page - 1) * itemsPerPageCadernos && index < page * itemsPerPageCadernos) {
                  item.style.display = 'block';
              }
          });

          renderCadernosPagination(totalPages);
      }

      function renderCadernosPagination(totalPages) {
          const container = document.getElementById('paginationCadernos');
          if (totalPages <= 1) {
              container.innerHTML = '';
              return;
          }

          let html = '<ul class="pagination pagination-sm shadow-sm m-0">';
          html += \`<li class="page-item \${currentPageCadernos === 1 ? 'disabled' : ''}">
                      <a class="page-link text-dark" href="#" onclick="event.preventDefault(); renderCadernosPage(\${currentPageCadernos - 1})">«</a>
                   </li>\`;

          for (let i = 1; i <= totalPages; i++) {
              html += \`<li class="page-item \${i === currentPageCadernos ? 'active' : ''}">
                          <a class="page-link \${i === currentPageCadernos ? 'fw-bold text-white bg-primary border-primary' : 'text-dark'}" href="#" onclick="event.preventDefault(); renderCadernosPage(\${i})">\${i}</a>
                       </li>\`;
          }

          html += \`<li class="page-item \${currentPageCadernos === totalPages ? 'disabled' : ''}">
                      <a class="page-link text-dark" href="#" onclick="event.preventDefault(); renderCadernosPage(\${currentPageCadernos + 1})">»</a>
                   </li></ul>\`;
          container.innerHTML = html;
      }

      function limparFiltrosCadernos() {
          const form = document.getElementById('formFiltroCadernos');
          if (form) {
              form.querySelectorAll('input').forEach(i => i.value = '');
              prepararBuscaSimples(null, form, 'Filtro de rotas limpo!');
          }
      }

      // =======================================================================
      // CÁLCULO DE DEGRAUS E LÓGICA DE VALORES
      // =======================================================================
      function getTierValue(qtd, tipo) {
          if (qtd <= 0) return 0;
          if (tipo === 'mot') {
              if (qtd <= 6) return TAXAS.mot_t1 || 80;
              if (qtd <= 9) return TAXAS.mot_t2 || 95;
              return TAXAS.mot_t3 || 110;
          } else {
              if (qtd <= 6) return TAXAS.aju_t1 || 55;
              if (qtd <= 9) return TAXAS.aju_t2 || 65;
              return TAXAS.aju_t3 || 75;
          }
      }

      // IMPORTANTE: Agora ele respeita o valor salvo no BD (data-pago) para não sobrescrever o preço fixo nos cards!
      function carregarTaxas() {
          document.querySelectorAll('.motorista-calc').forEach(el => {
              let isPago = el.getAttribute('data-pago') === 'true';
              if (isPago) {
                  let val = parseFloat(el.getAttribute('data-valor')) || 0;
                  el.innerText = 'R$ ' + val.toLocaleString('pt-BR', {minimumFractionDigits: 2});
              } else {
                  let qtd = parseInt(el.getAttribute('data-qtd')) || 0;
                  el.innerText = 'R$ ' + getTierValue(qtd, 'mot').toLocaleString('pt-BR', {minimumFractionDigits: 2});
              }
          });
          document.querySelectorAll('.ajudante-calc').forEach(el => {
              let isPago = el.getAttribute('data-pago') === 'true';
              if (isPago) {
                  let val = parseFloat(el.getAttribute('data-valor')) || 0;
                  el.innerText = 'R$ ' + val.toLocaleString('pt-BR', {minimumFractionDigits: 2});
              } else {
                  let qtd = parseInt(el.getAttribute('data-qtd')) || 0;
                  el.innerText = 'R$ ' + getTierValue(qtd, 'aju').toLocaleString('pt-BR', {minimumFractionDigits: 2});
              }
          });
      }

      // Modificado para manter o campo de Qtd visível!
      function toggleViagemLonga(checkbox) {
          const divDestino = document.getElementById('divDestinoLonga');
          const switchAlmoco = document.getElementById('switchAlmoco');
          
          if (checkbox.checked) {
              divDestino.classList.remove('d-none');
              switchAlmoco.checked = true; // Auto ativa o almoço para viagens longas
          } else {
              divDestino.classList.add('d-none');
              switchAlmoco.checked = false;
          }
          calcularValor();
      }

      function toggleAlmoco() {
          calcularValor();
      }

      function calcularValor() {
          const qtd = parseInt(document.getElementById('qtdEntregas').value) || 0;
          const tipoColabInput = document.getElementById('tipoColabOculto').value;
          const isLonga = document.getElementById('switchViagemLonga') && document.getElementById('switchViagemLonga').checked;
          const hasAlmoco = document.getElementById('switchAlmoco') && document.getElementById('switchAlmoco').checked;
          
          let base = 0;

          if (tipoColabInput === 'motorista') {
              if (isLonga) {
                  const destino = document.getElementById('selectDestinoLonga').value;
                  if (destino === 'sulbahia') base = TAXAS.vl_sulbahia;
                  else if (destino === 'aracaju1') base = TAXAS.vl_aracaju1;
                  else if (destino === 'aracaju2') base = TAXAS.vl_aracaju2;
                  else if (destino === 'capimgrosso') base = TAXAS.vl_capimgrosso;
              } else {
                  base = getTierValue(qtd, 'mot');
              }
          } else if (tipoColabInput === 'ajudante') {
              base = getTierValue(qtd, 'aju');
          }

          let total = base;
          if (hasAlmoco) {
              total += (TAXAS.val_almoco || 25.00);
          }

          document.getElementById('valorTotalVisor').innerText = "R$ " + total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          document.getElementById('valorTotalInput').value = total.toFixed(2);
      }

      function abrirModalPagamento(colabId, qtdEntregas, tipoColab, cadernoId) {
          const select = document.getElementById('selectColaborador');
          const inputQtd = document.getElementById('qtdEntregas');
          const inputCaderno = document.getElementById('cadernoIdInput');
          const inputTipo = document.getElementById('tipoColabOculto');
          
          const chkPago = document.getElementById('jaPagoSwitch');
          const chkLonga = document.getElementById('switchViagemLonga');
          const chkAlmoco = document.getElementById('switchAlmoco');
          const fileInput = document.getElementById('fileComprovante');
          const containerLonga = document.getElementById('containerViagemLonga');
          const divDestino = document.getElementById('divDestinoLonga');
          
          // Reset Interface
          if(chkPago) { chkPago.checked = false; togglePagoState(chkPago); }
          if(fileInput) fileInput.value = '';
          if(chkLonga) chkLonga.checked = false;
          if(chkAlmoco) chkAlmoco.checked = false;
          
          divDestino.classList.add('d-none');

          select.value = colabId || "";
          inputQtd.value = qtdEntregas || 0;
          inputCaderno.value = cadernoId || "";
          inputTipo.value = tipoColab;
          
          // Apenas motoristas têm o botão de viagem longa disponível
          if (tipoColab === 'motorista') {
              containerLonga.style.display = 'block';
          } else {
              containerLonga.style.display = 'none';
          }
          
          atualizarPreviewColab();
          calcularValor();

          const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('novoPagamentoModal'));
          modal.show();
      }

      // =======================================================================
      // MENSAGEM DO PERÍODO COM CIDADES E FILTRO DE TIPO DE UTILIZADOR
      // =======================================================================
      function getColabDataJs(nomeBusca) {
          if (!nomeBusca) return null;
          const colab = listaDB.find(c => c.nome.toLowerCase() === nomeBusca.toLowerCase().trim());
          if (colab) return colab;
          // Retorna um fallback sempre marcado como motorista normal/mensalista
          return { nome: nomeBusca, pix: 'Não cadastrado', banco: 'Não cadastrado', cpf: 'Não cadastrado', tipo_usuario: 'motorista' };
      }

      function dispararMensagemPeriodo() {
          const listaCadernosDB = ${cadernosSensiveis};
          
          if(listaCadernosDB.length === 0) {
              mostrarToast('erro', 'Atenção', 'Nenhuma rota encontrada neste filtro para gerar relatório.');
              return;
          }

          const agrupadoPorData = {};
          listaCadernosDB.forEach(c => {
              if(!agrupadoPorData[c.data_formatada]) agrupadoPorData[c.data_formatada] = [];
              agrupadoPorData[c.data_formatada].push(c);
          });

          let msg = \`Relatório de Pagamentos - Ecoflow\\n\\n\`;
          let totalGeral = 0;

          Object.keys(agrupadoPorData).forEach(data => {
              let msgDia = \`[ Data: \${data} ]\\n\`;
              let adicionouAlguemNoDia = false;
              
              agrupadoPorData[data].forEach(c => {
                  let msgRota = "";
                  let adicionouAlguemNaRota = false;
                  
                  const strCidades = c.cidades ? \` (\${c.cidades})\` : '';
                  msgRota += \`* Rota #\${c.id}\${strCidades} - \${c.qtd_entregas} locais\\n\`;
                  
                  if (c.motorista) {
                      const mot = getColabDataJs(c.motorista);
                      const isMotAvulsoJs = mot.tipo_usuario === 'motorista_avulso';
                      
                      if (isMotAvulsoJs) {
                          const valMot = getTierValue(c.qtd_entregas, 'mot');
                          totalGeral += valMot;
                          msgRota += \`   > MOT: \${mot.nome} - R$ \${valMot.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\\n\`;
                          msgRota += \`   > PIX: \${mot.pix} (\${mot.banco})\\n\`;
                          adicionouAlguemNaRota = true;
                      }
                  }

                  if (c.ajudante && c.ajudante.trim() !== "") {
                      const aju = getColabDataJs(c.ajudante);
                      const valAju = getTierValue(c.qtd_entregas, 'aju');
                      totalGeral += valAju;
                      msgRota += \`   > AJU: \${aju.nome} - R$ \${valAju.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\\n\`;
                      msgRota += \`   > PIX: \${aju.pix} (\${aju.banco})\\n\`;
                      adicionouAlguemNaRota = true;
                  }
                  
                  if (adicionouAlguemNaRota) {
                      msgDia += msgRota + \`\\n\`;
                      adicionouAlguemNoDia = true;
                  }
              });
              
              if (adicionouAlguemNoDia) {
                  msg += msgDia;
              }
          });

          msg += \`------------------------\\n*TOTAL DO PERÍODO: R$ \${totalGeral.toLocaleString('pt-BR', {minimumFractionDigits: 2})}*\\n\`;
          msg += \`(Valores baseados nas diárias por escala. Viagens longas e almoço são registados no lançamento individual.)\`;

          const url = \`https://wa.me/\${NUMERO_WPP}?text=\${encodeURIComponent(msg)}\`;
          window.open(url, '_blank');
          
          bootstrap.Modal.getInstance(document.getElementById('modalMensagemPeriodo')).hide();
      }

      function togglePagoState(checkbox) {
          const previewCard = document.getElementById('previewCard');
          const submitBtn = document.getElementById('btnSubmitPagamento');
          const compContainer = document.getElementById('comprovanteContainer');
          
          if (checkbox.checked) {
              if(previewCard && !previewCard.classList.contains('d-none')) {
                  previewCard.classList.remove('bg-white', 'border-light');
                  previewCard.classList.add('card-pago');
              }
              if(submitBtn) {
                  submitBtn.innerHTML = 'Confirmar como Pago';
                  submitBtn.classList.replace('btn-primary', 'btn-success');
              }
              if(compContainer) {
                  compContainer.style.opacity = '1';
                  compContainer.style.pointerEvents = 'auto';
                  compContainer.style.transform = 'translateY(0)';
              }
          } else {
              if(previewCard) {
                  previewCard.classList.add('bg-white', 'border-light');
                  previewCard.classList.remove('card-pago');
              }
              if(submitBtn) {
                  submitBtn.innerHTML = 'Lançar ao Histórico';
                  submitBtn.classList.replace('btn-success', 'btn-primary');
              }
              if(compContainer) {
                  compContainer.style.opacity = '0.4';
                  compContainer.style.pointerEvents = 'none';
                  compContainer.style.transform = 'translateY(-5px)';
                  document.getElementById('fileComprovante').value = ''; 
              }
          }
      }

      function atualizarPreviewColab() {
          const select = document.getElementById('selectColaborador');
          const previewCard = document.getElementById('previewCard');
          
          if (!select.value) {
              previewCard.classList.add('d-none');
              return;
          }

          const colab = listaDB.find(c => c.id == select.value);
          if (colab) {
              document.getElementById('prevFoto').src = colab.foto;
              document.getElementById('prevNome').innerText = colab.nome;
              document.getElementById('prevTipo').innerText = colab.tipo_usuario.replace('_', ' ').toUpperCase();
              document.getElementById('prevCpf').innerText = colab.cpf;
              document.getElementById('prevBanco').innerText = colab.banco;
              document.getElementById('prevPix').innerText = colab.pix;
              
              previewCard.classList.remove('d-none');
              
              const isChecked = document.getElementById('jaPagoSwitch').checked;
              if (isChecked) {
                  previewCard.classList.remove('bg-white', 'border-light');
                  previewCard.classList.add('card-pago');
              }
          }
      }

      function mostrarToast(tipo, titulo, mensagem) {
          const toastEl = document.getElementById(tipo === 'sucesso' ? 'sucessoToast' : 'erroToast');
          if (toastEl) {
              document.getElementById(tipo === 'sucesso' ? 'sucessoTitulo' : 'erroTitulo').innerText = titulo;
              document.getElementById(tipo === 'sucesso' ? 'sucessoSub' : 'erroSub').innerText = mensagem;
              
              const timerEl = document.getElementById(tipo === 'sucesso' ? 'sucessoTimer' : 'erroTimer');
              if (timerEl) {
                  timerEl.style.display = 'block';
                  timerEl.style.animation = 'none';
                  timerEl.offsetHeight; 
                  timerEl.style.animation = 'shrinkToast 5s linear forwards';
              }

              const oldInstance = bootstrap.Toast.getInstance(toastEl);
              if (oldInstance) oldInstance.dispose();
              const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
              toast.show();
          }
      }

      function gerarSkeletonTabela(quantidade = 4) {
          let html = '';
          for(let i=0; i<quantidade; i++) {
              html += \`
              <tr class="align-middle">
                  <td class="py-3 px-3">
                      <div class="d-flex align-items-center">
                          <div class="skeleton-view skeleton-avatar-view me-3 flex-shrink-0"></div>
                          <div class="skeleton-view skeleton-text-view" style="width: 140px; margin: 0;"></div>
                      </div>
                  </td>
                  <td class="py-3 px-3"><div class="skeleton-view skeleton-text-view" style="width: 100px; margin: 0;"></div></td>
                  <td class="py-3 px-3"><div class="skeleton-view skeleton-text-view" style="width: 50px; margin: 0 auto;"></div></td>
                  <td class="py-3 px-3"><div class="skeleton-view skeleton-text-view" style="width: 80px; margin: 0;"></div></td>
                  <td class="py-3 px-3"><div class="skeleton-view skeleton-text-view" style="width: 70px; margin: 0 auto;"></div></td>
                  <td class="text-end py-3 px-3"><div class="skeleton-view" style="height: 28px; width: 60px; border-radius: 4px; display: inline-block;"></div></td>
              </tr>\`;
          }
          return html;
      }

      function mostrarSkeletonGlobais() {
          const container = document.getElementById('tabelaContainer');
          const emptyState = document.querySelector('.content > .text-center-empty');
          
          if (document.getElementById('skeleton-temp-container')) return;

          const skeletonHTML = \`
          <div id="skeleton-temp-container" class="table-responsive bg-white rounded-3 shadow-sm border border-light mb-4 skeleton-container">
              <table class="table table-hover align-middle mb-0" style="font-size: 0.85rem;">
                 <thead class="table-light">
                   <tr>
                     <th class="py-2 px-3 fw-bold text-muted border-0">Colaborador</th>
                     <th class="py-2 px-3 fw-bold text-muted border-0">Data do Serviço</th>
                     <th class="py-2 px-3 fw-bold text-muted border-0 text-center">Entregas</th>
                     <th class="py-2 px-3 fw-bold text-muted border-0">Valor Total</th>
                     <th class="py-2 px-3 fw-bold text-muted border-0 text-center">Status</th>
                     <th class="py-2 px-3 fw-bold text-muted border-0 text-end">Ações</th>
                   </tr>
                 </thead>
                 <tbody class="border-top-0">
                    \${gerarSkeletonTabela(4)}
                 </tbody>
              </table>
          </div>\`;

          if (container && !container.classList.contains('skeleton-container')) {
              container.style.display = 'none';
              container.insertAdjacentHTML('beforebegin', skeletonHTML);
          } else if (emptyState) {
              emptyState.style.display = 'none';
              emptyState.insertAdjacentHTML('beforebegin', skeletonHTML);
          }
      }

      function ocultarSkeletonGlobais() {
          const tempSkeleton = document.getElementById('skeleton-temp-container');
          if (tempSkeleton) tempSkeleton.remove();

          const container = document.getElementById('tabelaContainer');
          const emptyState = document.querySelector('.content > .text-center-empty');

          if (container) container.style.display = '';
          if (emptyState) emptyState.style.display = '';
      }

      mostrarSkeletonGlobais();
      window.addEventListener('load', () => {
          ocultarSkeletonGlobais();
          carregarTaxas();
          renderCadernosPage(1); 
      });

      let isSubmitting = false;

      async function prepararBuscaSimples(event, form, titleMsg) {
          if (event) event.preventDefault();
          mostrarSkeletonGlobais();

          try {
              const formData = new FormData(form);
              const queryString = new URLSearchParams(formData).toString();
              const url = form.action + '?' + queryString;

              const response = await fetch(url, { method: 'GET' });
              if (response.ok) {
                  const html = await response.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) {
                      oldContent.innerHTML = newContent.innerHTML;
                  }
                  
                  atualizarModaisDinamicos(doc);
                  carregarTaxas();
                  renderCadernosPage(currentPageCadernos);
                  
                  window.history.pushState({}, '', url);
                  mostrarToast('sucesso', 'Busca Concluída!', titleMsg);
              } else {
                  mostrarToast('erro', 'Erro', 'Não foi possível realizar a busca.');
              }
          } catch (err) {
              mostrarToast('erro', 'Falha', 'Verifique a sua rede.');
          } finally {
              ocultarSkeletonGlobais();
          }
      }

      function limparFiltros() {
          const form = document.getElementById('formFiltro');
          if (form) {
              form.querySelectorAll('input').forEach(i => i.value = '');
              prepararBuscaSimples(null, form, 'Filtros limpos!');
          }
      }

      async function navegarPagina(event, url) {
          event.preventDefault();
          mostrarSkeletonGlobais();
          try {
              const response = await fetch(url, { method: 'GET' });
              if (response.ok) {
                  const html = await response.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');
                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) {
                      oldContent.innerHTML = newContent.innerHTML;
                  }
                  atualizarModaisDinamicos(doc);
                  carregarTaxas();
                  renderCadernosPage(1);
                  window.history.pushState({}, '', url);
              }
          } catch (err) {
              mostrarToast('erro', 'Erro', 'Falha ao carregar.');
          } finally {
              ocultarSkeletonGlobais();
          }
      }

      async function prepararSubmissaoSimples(event, form, titleMsg) {
          event.preventDefault();
          if (!form.checkValidity()) { form.reportValidity(); return; }
          if (isSubmitting) return;

          const modalEl = form.closest('.modal');
          if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
              modal.hide();
          }
          document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
          document.body.classList.remove('modal-open');
          document.body.style = '';

          mostrarSkeletonGlobais();
          isSubmitting = true;

          try {
              let fetchOptions = { method: form.method || 'POST' };

              if (form.enctype === 'multipart/form-data') {
                  fetchOptions.body = new FormData(form);
              } else {
                  const formData = new URLSearchParams();
                  const fd = new FormData(form);
                  for (const [key, value] of fd.entries()) {
                      formData.append(key, value);
                  }
                  fetchOptions.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
                  fetchOptions.body = formData.toString();
              }

              const response = await fetch(form.action, fetchOptions);

              if (response.ok) {
                  const freshResponse = await fetch(window.location.href);
                  const html = await freshResponse.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  const oldContent = document.querySelector('.content');
                  const newContent = doc.querySelector('.content');
                  if (oldContent && newContent) {
                      oldContent.innerHTML = newContent.innerHTML;
                  }

                  atualizarModaisDinamicos(doc);
                  carregarTaxas();
                  renderCadernosPage(currentPageCadernos);

                  form.reset();
                  
                  const prevCard = document.getElementById('previewCard');
                  if(prevCard) {
                      prevCard.classList.add('d-none');
                      prevCard.classList.remove('card-pago');
                  }
                  const valorVisor = document.getElementById('valorTotalVisor');
                  if(valorVisor) valorVisor.innerText = "R$ 0,00";

                  mostrarToast('sucesso', 'Concluído!', titleMsg);
              } else {
                  mostrarToast('erro', 'Erro', 'Falha ao salvar no banco de dados.');
              }
          } catch (err) {
              mostrarToast('erro', 'Conexão', 'Verifique a sua internet.');
          } finally {
              isSubmitting = false;
              ocultarSkeletonGlobais();
          }
      }

      function atualizarModaisDinamicos(doc) {
          const staticModals = ['sidebarMenu'];
          document.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) m.remove();
          });
          doc.querySelectorAll('.modal').forEach(m => {
              if (!staticModals.includes(m.id)) document.body.appendChild(m.cloneNode(true));
          });
      }
    </script>
  </body>
  </html>
  `;
}

module.exports = controlePagamentosView;