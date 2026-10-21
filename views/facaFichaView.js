// views/facaFichaView.js
function facaFichaView(faca, urlCompleta) {
    const imgCapa = faca.foto ? `/uploads/${faca.foto}` : null;
    const catColor = faca.categoria === 'rotativa' ? 'text-primary' : 'text-warning';
    
    let chapas = [];
    try { chapas = JSON.parse(faca.chapas_utilizadas || '[]'); } 
    catch(e) { chapas = [faca.chapas_utilizadas]; }
    const chapasTexto = chapas.filter(c => c).length > 0 ? chapas.join(' • ') : 'Não especificadas';

    // Gerador de QR Code usando a API do QRServer
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(urlCompleta)}`;

    return `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ficha Técnica - ${faca.modelo || 'Sem Modelo'} | ${faca.tamanho_referencia || '-'}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            body { background-color: #f0f2f5; color: #333; font-family: 'Segoe UI', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .ficha-container { max-width: 850px; margin: 30px auto; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e9ecef; }
            .header-section { border-bottom: 3px solid #08c068; padding-bottom: 15px; margin-bottom: 20px; }
            .info-label { font-size: 0.75rem; text-transform: uppercase; color: #6c757d; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 2px; }
            .info-value { font-size: 1.1rem; font-weight: 500; color: #212529; margin-bottom: 15px; border-bottom: 1px dashed #e9ecef; padding-bottom: 8px; }
            .qr-wrapper { text-align: center; border: 2px dashed #dee2e6; padding: 20px; border-radius: 16px; background: #f8f9fa; }
            .print-btn { background-color: #08c068; color: #1f1f1f; border: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; font-size: 1rem; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(8, 192, 104, 0.3); }
            .print-btn:hover { background-color: #06a055; color: #fff; transform: translateY(-2px); }
            
            /* Ajustes Mobile */
            @media (max-width: 768px) {
                body { background-color: #fff; }
                .ficha-container { margin: 0 auto; border-radius: 0; box-shadow: none; border: none; padding: 20px !important; }
                .info-value { font-size: 1rem; }
                .header-section h2 { font-size: 1.5rem; }
                .logo-header { max-height: 35px !important; }
            }

            @media print {
                body { background: #fff; }
                .ficha-container { box-shadow: none; border: none; margin: 0; padding: 0; max-width: 100%; }
                .no-print { display: none !important; }
                .info-value { border-bottom: 1px solid #ddd; }
            }
        </style>
    </head>
    <body>
        <div class="container p-0 p-md-3">
            <div class="ficha-container p-4">
                
                <div class="d-flex justify-content-between align-items-center header-section flex-wrap gap-2">
                    <div>
                        <h2 class="fw-bold mb-1" style="color: #1f1f1f;">${faca.id}</h2>
                        <span class="${catColor} fw-bold text-uppercase"><i class="fa-solid fa-scissors me-1"></i> Faca ${faca.categoria}</span>
                    </div>
                    <div class="text-md-end text-start">
                        <img src="/img/logo.png" alt="Ecoflow" class="logo-header" style="max-height: 45px; opacity: 0.8;">
                    </div>
                </div>

                <div class="row align-items-center mb-4 flex-column-reverse flex-md-row">
                    <div class="col-12 col-md-8 mt-4 mt-md-0">
                        <div class="row">
                            <div class="col-12">
                                <div class="info-label">Modelo</div>
                                <div class="info-value fs-4 fw-bold text-dark border-0">${faca.modelo || '-'}</div>
                            </div>
                            <div class="col-6">
                                <div class="info-label">Tamanho</div>
                                <div class="info-value">${faca.tamanho_referencia || '-'}</div>
                            </div>
                            <div class="col-6">
                                <div class="info-label">Medida</div>
                                <div class="info-value">${faca.medida || '-'}</div>
                            </div>
                            <div class="col-6">
                                <div class="info-label">Versão</div>
                                <div class="info-value">${faca.versao || '-'}</div>
                            </div>
                            <div class="col-6">
                                <div class="info-label">Componente</div>
                                <div class="info-value">${faca.componente || '-'}</div>
                            </div>
                            <div class="col-12">
                                <div class="info-label">Configuração</div>
                                <div class="info-value">${faca.configuracao || '-'}</div>
                            </div>
                            <div class="col-12">
                                <div class="info-label">Utilização Principal</div>
                                <div class="info-value">${faca.utilizacao || '-'}</div>
                            </div>
                            <div class="col-12">
                                <div class="info-label">Chapas Compatíveis</div>
                                <div class="info-value border-0 fw-bold" style="color: #08c068;">${chapasTexto}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-md-4 text-center">
                        <div class="qr-wrapper shadow-sm">
                            <img src="${qrUrl}" alt="QR Code" class="img-fluid mb-2" style="border-radius: 8px; max-width: 180px;">
                            
                            <div class="d-flex justify-content-center gap-2 no-print">
                                <button onclick="baixarQR('png')" class="btn btn-sm btn-outline-secondary" title="Baixar Imagem PNG"><i class="fa-solid fa-download"></i> PNG</button>
                                <button onclick="baixarQR('svg')" class="btn btn-sm btn-outline-secondary" title="Baixar Vetor SVG"><i class="fa-solid fa-download"></i> SVG</button>
                            </div>
                        </div>
                    </div>
                </div>

                ${imgCapa ? `
                <div class="mt-4 text-center border p-2 rounded bg-light">
                    <div class="info-label text-start mb-2 ms-2">Foto da Faca</div>
                    <img src="${imgCapa}" alt="Foto da Faca" class="img-fluid rounded" style="max-height: 400px; object-fit: contain;">
                </div>
                ` : ''}

                <div class="text-center mt-5 no-print">
                    <button onclick="window.print()" class="print-btn w-100 w-md-auto mb-2 mb-md-0"><i class="fa-solid fa-print me-2"></i>Imprimir Etiqueta</button>
                    <a href="javascript:window.close();" class="btn btn-link text-muted d-block text-decoration-none mt-3">Fechar</a>
                </div>

            </div>
        </div>

        <script>
            // Função para forçar o download do arquivo a partir da URL da API geradora do QR Code
            async function baixarQR(formato) {
                const btnOriginal = event.currentTarget.innerHTML;
                event.currentTarget.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                event.currentTarget.disabled = true;

                const urlCompleta = encodeURIComponent(window.location.href);
                // Size 500x500 garante alta qualidade tanto no SVG como no PNG
                const url = \`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=\${urlCompleta}&format=\${formato}\`;
                
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = \`QR_\${'${faca.id}'}.\${formato}\`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (err) {
                    alert('Erro ao tentar baixar o QR Code. Verifique sua conexão com a internet.');
                } finally {
                    event.currentTarget.innerHTML = btnOriginal;
                    event.currentTarget.disabled = false;
                }
            }
        </script>
    </body>
    </html>
    `;
}

module.exports = facaFichaView;