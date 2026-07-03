// views/termosComponent.js
function termosComponent(user) {
    // Se o utilizador já aceitou, não renderiza absolutamente nada no DOM
    if (user && user.termos_aceitos == 1) return '';

    // Gera a data atual no formato extenso (ex: 03 de julho de 2026)
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const nomeColaborador = user && user.nome ? user.nome : 'Usuário do Sistema';

    return `
    <style>
       @keyframes toastTermosSlideUp {
            from {
                transform: translateY(120%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        .toast-termos-motion.animar {
            animation: toastTermosSlideUp 0.45s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
        @media (max-width: 575.98px) {
            #toastTermos {
                width: calc(100vw - 24px) !important;
            }
            #toastTermos .toast-body {
                flex-direction: column;
                align-items: stretch !important;
                text-align: center !important;
                padding: 1rem !important;
            }
            #toastTermos .toast-icon {
                margin-right: 0 !important;
                margin-bottom: 0.75rem;
                align-self: center;
                width: 42px !important;
                height: 42px !important;
            }
            #toastTermos .toast-content {
                padding-right: 0 !important;
                margin-bottom: 0.9rem;
            }
            #toastTermos .toast-actions {
                width: 100%;
            }
            #toastTermos .toast-actions .btn {
                width: 50%;
            }
        }
        /* Estilização específica do documento formal (Folha A4) */
        .folha-a4 {
            background-color: #ffffff;
            width: 210mm; /* Largura padrão de folha A4 */
            max-width: 100%; /* Garante que não quebra no telemóvel */
            margin: 0 auto; /* Centraliza a folha no modal */
            padding: 40px 30px;
            border-radius: 4px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        }
        @media (max-width: 767.98px) {
            .folha-a4 {
                padding: 20px 15px; /* Reduz as margens no telemóvel */
            }
        }
        .termos-texto p, .termos-texto li {
            font-family: 'Times New Roman', Times, serif;
            font-size: 0.85rem; /* Fonte reduzida */
            line-height: 1.6;
            color: #000000; /* Texto preto forçado */
            text-align: justify;
        }
        .termos-texto h5, .termos-texto h6, .termos-texto strong {
            font-family: 'Times New Roman', Times, serif;
            color: #000000; /* Texto preto forçado */
        }
        .termos-texto ul {
            padding-left: 1.5rem;
        }
        .termos-texto li {
            margin-bottom: 0.5rem;
        }
    </style>

          <!-- TOAST DE TERMOS (Canto inferior central) -->
    <div class="toast-container position-fixed bottom-0 start-50 translate-middle-x p-3" style="z-index: 9999;">
        <div class="toast-termos-motion">
            <div id="toastTermos" class="toast shadow-lg border-0 bg-custom-darker text-white" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="false" data-bs-animation="false" style="border: 1px solid rgba(8,192,104,0.4) !important; width: 560px; max-width: calc(100vw - 24px);">
                <div class="toast-body d-flex align-items-center text-start p-3">
                    <div class="toast-icon rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-3" style="width: 44px; height: 44px; background-color: rgba(8, 192, 104, 0.1);">
                        <i class="fa-solid fa-file-shield fa-lg text-accent"></i>
                    </div>

                    <div class="toast-content flex-grow-1 pe-3">
                        <strong class="d-block mb-1 fs-6">Termos e Privacidade</strong>
                        <span class="text-white-50 d-block" style="font-size: 0.82rem; line-height: 1.35;">
                            Para continuar a utilizar o Ecoflow com total segurança, leia e aceite as nossas políticas de uso.
                        </span>
                    </div>
                    
                    <div class="toast-actions d-flex gap-2 flex-shrink-0">
                        <button type="button" class="btn btn-sm btn-outline-secondary px-3" onclick="fecharToastTermos()">Fechar</button>
                        <button type="button" class="btn btn-sm btn-primary text-dark fw-bold px-4" onclick="abrirModalTermos()">Ler</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- MODAL DOS TERMOS -->
    <div class="modal fade" id="modalTermos" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content erp-modal bg-custom-darker shadow-lg border-custom">
                <div class="modal-header bg-custom-dark border-bottom border-custom p-3">
                    <h6 class="modal-title fw-bold text-white mb-0" style="font-size: 0.95rem;">
                        <i class="fa-solid fa-file-contract text-accent me-2"></i> Termos de uso do Ecoflow
                    </h6>
                </div>
                <div class="modal-body bg-custom-dark p-4">
                    
                    <!-- INÍCIO DA FOLHA A4 -->
                    <div class="folha-a4 termos-texto">
                        <h5 class="text-center fw-bold mb-4" style="font-size: 1.1rem;">TERMO DE RESPONSABILIDADE E USO DO SISTEMA ECOFLOW</h5>
                        
                        <p class="mb-1"><strong>EMPRESA:</strong> Eco Caixas BA</p>
                        <p class="mb-1"><strong>COLABORADOR(A):</strong> ${nomeColaborador}</p>
                        <p class="mb-4"><strong>DATA DO ACEITE:</strong> ${dataFormatada}</p>

                        <h6 class="fw-bold mt-4" style="font-size: 0.95rem;">Objetivo</h6>
                        <p>O presente Termo tem por finalidade estabelecer as responsabilidades do colaborador quanto ao acesso e utilização do Sistema Ecoflow, disponibilizado pela Eco Caixas BA para o desempenho de suas atividades profissionais.</p>

                        <h6 class="fw-bold mt-4" style="font-size: 0.95rem;">Responsabilidades do Colaborador</h6>
                        <p>Declaro estar ciente de que:</p>
                        <ul>
                            <li>O acesso ao Sistema Ecoflow destina-se exclusivamente ao desempenho das minhas atividades profissionais.</li>
                            <li>Meu login e senha são de uso pessoal e intransferível, sendo proibido o compartilhamento com terceiros.</li>
                            <li>As informações registradas, consultadas ou extraídas do sistema deverão ser utilizadas exclusivamente para fins relacionados às atividades da empresa.</li>
                            <li>É proibida a exclusão, alteração ou divulgação de informações sem autorização.</li>
                            <li>Devo comunicar imediatamente ao responsável qualquer suspeita de acesso indevido, perda de credenciais ou incidente relacionado ao sistema.</li>
                            <li>Em caso de desligamento, mudança de função ou sempre que solicitado pela empresa, meus acessos poderão ser bloqueados ou cancelados.</li>
                        </ul>

                        <h6 class="fw-bold mt-4" style="font-size: 0.95rem;">Confidencialidade e Proteção de Dados</h6>
                        <p>Declaro estar ciente de que o Sistema Ecoflow poderá conter informações confidenciais, estratégicas, financeiras, comerciais e dados pessoais de colaboradores, clientes e fornecedores.</p>
                        <p>Comprometo-me a manter absoluto sigilo sobre todas as informações acessadas em razão das minhas atividades, não sendo permitida sua divulgação, compartilhamento, cópia ou utilização para finalidade diversa daquela autorizada pela empresa.</p>
                        <p>Estou ciente de que o tratamento de dados pessoais deverá observar as disposições da Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018), bem como as normas internas da Eco Caixas BA.</p>

                        <h6 class="fw-bold mt-4" style="font-size: 0.95rem;">Declaração</h6>
                        <p>Declaro que recebi orientação quanto ao uso adequado do Sistema Ecoflow e comprometo-me a cumprir as normas estabelecidas pela empresa para sua utilização.</p>
                        <p>Estou ciente de que o uso inadequado do sistema, o compartilhamento de credenciais, o acesso não autorizado, a divulgação de informações confidenciais ou qualquer conduta que cause prejuízo à Eco Caixas BA poderá resultar na aplicação das medidas administrativas e disciplinares cabíveis, sem prejuízo das responsabilidades civis e penais previstas na legislação vigente.</p>
                        
                        <p class="mt-4 text-center">Por estar de acordo, firmo o presente Termo de forma eletrônica.</p>
                        <p class="text-center fw-bold">Camaçari/BA, ${dataFormatada}.</p>
                    </div>
                    <!-- FIM DA FOLHA A4 -->

                    <hr class="border-custom my-4">

                    <!-- CHECKBOX DE ACEITE DIGITAL REDUZIDO E CENTRALIZADO -->
                    <div class="d-flex justify-content-center">
                        <div class="form-check d-inline-flex align-items-center bg-custom-darker p-3 rounded border-custom w-auto m-0 shadow-sm">
                            <input 
                                class="form-check-input flex-shrink-0 mt-0 me-3 ms-0 float-none" 
                                type="checkbox" 
                                id="checkAceiteTermos" 
                                onchange="alternarBotaoAceite(this)" 
                                style="cursor: pointer; border-color: rgba(255,255,255,0.3);"
                            >

                            <label 
                                class="form-check-label text-white fw-bold mb-0 text-start" 
                                for="checkAceiteTermos" 
                                style="cursor: pointer; font-family: 'Segoe UI', sans-serif; font-size: 0.85rem;"
                            >
                                Li e aceito os Termos de Responsabilidade e Uso
                            </label>
                        </div>
                    </div>

                </div>
                <div class="modal-footer bg-custom-dark border-top border-custom p-3 d-flex justify-content-end gap-2">
                    <button type="button" class="btn btn-sm btn-outline-secondary text-white" data-bs-dismiss="modal">Cancelar</button>
                    <!-- O botão inicia desabilitado -->
                    <button type="button" class="btn btn-sm btn-primary text-dark fw-bold shadow-sm px-4" id="btnConcordarTermos" onclick="aceitarTermosSistema()" disabled>
                        <i class="fa-solid fa-check me-1"></i> Confirmar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
               document.addEventListener('DOMContentLoaded', () => {
            const toastEl = document.getElementById('toastTermos');
            const toastMotion = document.querySelector('.toast-termos-motion');

            if (toastEl) {
                const toast = new bootstrap.Toast(toastEl, {
                    autohide: false,
                    animation: false
                });

                setTimeout(() => {
                    if (toastMotion) {
                        toastMotion.classList.remove('animar');
                        void toastMotion.offsetWidth;
                        toastMotion.classList.add('animar');
                    }

                    toast.show();
                }, 1000);
            }
        });

        function fecharToastTermos() {
            const toastEl = document.getElementById('toastTermos');

            if (toastEl) {
                const toast = bootstrap.Toast.getInstance(toastEl) || new bootstrap.Toast(toastEl, {
                    autohide: false,
                    animation: false
                });

                toast.hide();
            }
        }

        function abrirModalTermos() {
            const toastEl = document.getElementById('toastTermos');
            if (toastEl) {
                const toast = bootstrap.Toast.getInstance(toastEl);
                if (toast) toast.hide();
            }
            const modal = new bootstrap.Modal(document.getElementById('modalTermos'));
            modal.show();
        }

        function alternarBotaoAceite(checkbox) {
            const btn = document.getElementById('btnConcordarTermos');
            btn.disabled = !checkbox.checked;
        }

        async function aceitarTermosSistema() {
            const btn = document.getElementById('btnConcordarTermos');
            const checkbox = document.getElementById('checkAceiteTermos');
            
            if (!checkbox.checked) return;

            const conteudoOriginal = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Registrando...';
            btn.disabled = true;

            try {
                const req = await fetch('/api/termos/aceitar', { method: 'POST' });
                const res = await req.json();
                
                if (res.success) {
                    const modalEl = document.getElementById('modalTermos');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    modal.hide();
                    
                    if (typeof mostrarToast === 'function') {
                        mostrarToast('sucesso', 'Obrigado!', 'Termo assinado digitalmente com sucesso.');
                    }
                    
                    // Remove os elementos do DOM para não pesarem a página
                    setTimeout(() => {
                        document.querySelector('.toast-termos-wrapper')?.remove();
                        modalEl.remove();
                    }, 500);
                } else {
                    throw new Error('Falha na resposta');
                }
            } catch (e) {
                btn.innerHTML = conteudoOriginal;
                btn.disabled = false;
                if (typeof mostrarToast === 'function') {
                    mostrarToast('erro', 'Aviso', 'Ocorreu um erro ao salvar o aceite. Verifique a internet e tente novamente.');
                } else {
                    alert('Erro ao aceitar os termos. Tente novamente.');
                }
            }
        }
    </script>
    `;
}

module.exports = termosComponent;