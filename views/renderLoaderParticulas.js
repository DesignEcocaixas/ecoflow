// views/renderLoaderParticulas.js

function renderLoaderParticulas(texto = "Carregando...") {
    return `
    <style>
        /* Estilos do novo Spinner e Fundo */
        #globalLoader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(244, 247, 246, 0.85); /* Fundo claro da aplicação */
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: opacity 0.4s ease;
        }

        .erp-spinner {
            width: 3.5rem;
            height: 3.5rem;
            border: 0.35em solid rgba(13, 87, 73, 0.15); /* Trilho do spinner */
            border-right-color: #0D5749; /* Cor principal da marca */
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 1rem;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .loader-text {
            color: #0D5749;
            font-weight: 600;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            letter-spacing: 1px;
            font-size: 0.95rem;
            animation: pulseTextLoader 1.5s infinite ease-in-out;
        }

        @keyframes pulseTextLoader { 
            0%, 100% { opacity: 1; } 
            50% { opacity: 0.5; } 
        }
    </style>

    <div id="globalLoader">
        <div class="erp-spinner"></div>
        <div class="loader-text">${texto}</div>
    </div>

    <script>
        (function() {
            // Automatiza a abertura e fecho do loader entre as páginas
            window.addEventListener('pageshow', function(event) {
                const loader = document.getElementById('globalLoader');
                if (loader) {
                    if (event.persisted) {
                        // Se voltar pelo cache do navegador (botão de voltar)
                        loader.style.display = 'none';
                        loader.style.opacity = '0';
                    } else {
                        // Tempo mínimo de exibição para a transição ser suave
                        setTimeout(() => {
                            loader.style.opacity = '0';
                            setTimeout(() => { loader.style.display = 'none'; }, 400);
                        }, 500); 
                    }
                }
            });

            window.addEventListener('beforeunload', function() {
                const loader = document.getElementById('globalLoader');
                if (loader) {
                    loader.style.display = 'flex';
                    // Força a renderização do display:flex antes de mudar a opacidade
                    void loader.offsetWidth; 
                    loader.style.opacity = '1';
                }
            });
        })();
    </script>
    `;
}

module.exports = renderLoaderParticulas;