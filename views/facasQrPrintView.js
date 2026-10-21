// views/facasQrPrintView.js
function facasQrPrintView(facas, baseUrl) {
    const etiquetas = facas.map(f => {
        // Link que o QR code vai ler (a ficha técnica)
        const urlFicha = `${baseUrl}/catalogo-facas/ficha/${f.id}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(urlFicha)}`;

        // Lógica para detetar Tampa, Fundo ou Conjugada
        let textoComponente = "CONJUGADA";
        if (f.componente) {
            const compLower = f.componente.toLowerCase();
            if (compLower.includes("tampa")) {
                textoComponente = "TAMPA";
            } else if (compLower.includes("fundo")) {
                textoComponente = "FUNDO";
            }
        }

        return `
        <div class="etiqueta">
            <div class="categoria">${f.categoria}</div>
            <img src="${qrUrl}" class="qr-code" alt="QR Code ${f.id}">
            <div class="modelo" title="${f.modelo}">${f.modelo || 'Sem modelo'}</div>
            <div class="ref">${f.tamanho_referencia || '-'}</div>
            <div class="componente-badge">${textoComponente}</div>
            <div class="codigo">${f.id}</div>
        </div>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Imprimir QR Codes - Facas</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            body { background: #f0f2f5; font-family: 'Segoe UI', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            
            .actions-bar { background: #fff; padding: 15px 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #ddd; }
            
            .print-container { max-width: 210mm; margin: 20px auto; background: white; padding: 10mm; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            
            .grid-etiquetas { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
            
            .etiqueta { border: 1px dashed #ccc; padding: 10px; text-align: center; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 230px; overflow: hidden; }
            .etiqueta .categoria { font-size: 9px; text-transform: uppercase; font-weight: bold; color: #555; background: #eee; padding: 2px 6px; border-radius: 3px; margin-bottom: 5px; }
            .etiqueta .qr-code { width: 85px; height: 85px; margin-bottom: 6px; }
            
            /* Ajustado para não quebrar o layout: se o nome for gigante, quebra em 2 linhas e esconde o resto */
            .etiqueta .modelo { font-size: 13px; font-weight: 800; color: #000; width: 100%; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2; margin-top: 2px; }
            .etiqueta .ref { font-size: 12px; font-weight: 700; color: #222; margin-top: 3px; }
            
            /* Destaque do componente */
            .etiqueta .componente-badge { font-size: 10px; font-weight: 800; color: #000; border: 1px solid #444; padding: 2px 8px; border-radius: 4px; margin-top: 5px; letter-spacing: 0.5px; }
            
            .etiqueta .codigo { font-size: 9px; color: #888; margin-top: 6px; font-family: monospace; }

            @media print {
                body { background: white; }
                .actions-bar { display: none !important; }
                .print-container { box-shadow: none; margin: 0; padding: 0; max-width: 100%; }
                .grid-etiquetas { gap: 6px; }
                .etiqueta { border: 1px solid #ccc; break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="actions-bar d-flex justify-content-between align-items-center no-print">
            <div>
                <h5 class="mb-0 fw-bold"><i class="fa-solid fa-qrcode me-2 text-primary"></i>Etiquetas QR Code</h5>
                <span class="text-muted small">${facas.length} facas cadastradas</span>
            </div>
            <div>
                <button onclick="window.close()" class="btn btn-outline-secondary me-2">Fechar</button>
                <button onclick="window.print()" class="btn btn-primary fw-bold shadow-sm"><i class="fa-solid fa-print me-1"></i> Imprimir Tudo</button>
            </div>
        </div>

        <div class="print-container">
            <div class="grid-etiquetas">
                ${etiquetas}
            </div>
        </div>
    </body>
    </html>
    `;
}

module.exports = facasQrPrintView;