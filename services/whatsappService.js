// services/whatsappService.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');

console.log('[WHATSAPP] 🚀 Inicializando módulo do serviço com OTIMIZAÇÃO EXTREMA DE RAM...');

// Aumento global de listeners para evitar memory leaks no express
require('events').EventEmitter.defaultMaxListeners = 20;

const client = new Client({
    authStrategy: new LocalAuth(),
    authTimeoutMs: 60000,
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1018.0-web_light.html'
    },
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-extensions', 
            '--disable-gpu',
            '--disable-software-rasterizer', // Reduz consumo de renderização CPU
            '--mute-audio', // Corta carregamento de drivers de aúdio
            '--disable-features=IsolateOrigins,site-per-process,FirstPartySets,PrivacySandboxSettings4', // Desativa isolamento (Economia massiva de RAM)
            '--js-flags=--expose-gc --max-old-space-size=256' // Libera Garbage Collection manual e trava o teto da aba em 256MB
        ]
    }
});

const whatsappEstado = {
    isReady: false,
    ultimoQrCode: null,
    logsTerminal: []
};

const registrarLogTerminal = (texto) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const logFormatado = `[${timestamp}] ${texto}`;
    console.log(logFormatado);
    
    whatsappEstado.logsTerminal.push(logFormatado);
    if (whatsappEstado.logsTerminal.length > 50) {
        whatsappEstado.logsTerminal.shift();
    }
};

// ============================================================================
// ESCUDO DE MEMÓRIA: ABORTA DOWNLOAD DE FOTOS, VÍDEOS, FONTES E CSS DO CHROME
// ============================================================================
let interceptacaoAtiva = false;
const ativarLowRamMode = async () => {
    if (client && client.pupPage && !interceptacaoAtiva) {
        try {
            interceptacaoAtiva = true;
            await client.pupPage.setRequestInterception(true);
            client.pupPage.on('request', (req) => {
                const rType = req.resourceType();
                // Aborta impiedosamente recursos pesados e visuais
                if (rType === 'image' || rType === 'media' || rType === 'font' || rType === 'stylesheet') {
                    req.abort();
                } else {
                    req.continue();
                }
            });
            registrarLogTerminal('🛡️ Modo Low-RAM Ativado: Bloqueando processamento visual e mídias.');
        } catch (e) {
            interceptacaoAtiva = false;
            console.log('[WHATSAPP] Falha ao injetar Low-RAM:', e.message);
        }
    }
};

client.on('loading_screen', async (percent, message) => {
    registrarLogTerminal(`⏳ Carregando: ${percent}% - ${message}`);
    ativarLowRamMode(); // Garante que a injeção comece bem cedo
});

client.on('qr', async (qr) => {
    ativarLowRamMode(); // Reforço caso o evento anterior falhe
    console.log('\n==================================================');
    console.log('🤖 SCANNEIE O QR CODE ABAIXO COM O WHATSAPP DA EMPRESA');
    console.log('==================================================\n');
    qrcodeTerminal.generate(qr, { small: true });

    try {
        whatsappEstado.ultimoQrCode = await QRCode.toDataURL(qr);
    } catch (errQr) {
        console.error('[WHATSAPP] Erro ao converter QR para DataURL:', errQr.message);
    }
});

client.on('authenticated', () => {
    whatsappEstado.ultimoQrCode = null; 
    registrarLogTerminal('🔑 Autenticado! Sincronizando (apenas texto por segurança de RAM)...');
});

client.on('ready', () => {
    whatsappEstado.isReady = true; 
    whatsappEstado.ultimoQrCode = null;
    registrarLogTerminal('✅ Bot do WhatsApp conectado e pronto para disparar mensagens!');
});

client.on('auth_failure', msg => {
    whatsappEstado.isReady = false;
    whatsappEstado.ultimoQrCode = null;
    registrarLogTerminal(`❌ Falha na autenticação do WhatsApp: ${msg}`);
});

client.on('disconnected', (reason) => {
    whatsappEstado.isReady = false;
    whatsappEstado.ultimoQrCode = null; 
    registrarLogTerminal(`❌ O WhatsApp foi desconectado pelo usuário ou dispositivo: ${reason}`);
});

const forcarResetEstadoManual = () => {
    whatsappEstado.isReady = false;
    whatsappEstado.ultimoQrCode = null;
    interceptacaoAtiva = false; // Reseta flag para a proxima inicialização
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    whatsappEstado.logsTerminal.push(`[${timestamp}] 🔌 Limpando sessão antiga... Inicializando folha limpa de navegação.`);
};

// ============================================================================
// LIXEIRO AUTOMÁTICO (Evita que o Chrome vaze memória com o passar das horas)
// ============================================================================
setInterval(async () => {
    if (client && client.pupPage && whatsappEstado.isReady && !client.pupPage.isClosed()) {
        try {
            await client.pupPage.evaluate(() => {
                if (window.gc) window.gc(); // Despeja o lixo do V8
                console.clear();            // Evita estouro de array no console interno
            });
        } catch (e) {}
    }
}, 60000 * 5); // Corre a cada 5 minutos silenciosamente

// NOVA FUNÇÃO MELHORADA: Desperta e garante que a interface está 100% carregada
const despertarNavegador = async () => {
    if (!client || !client.pupPage) {
        throw new Error("A instância do navegador não foi encontrada.");
    }
    
    if (client.pupPage.isClosed()) {
        throw new Error("A aba do WhatsApp foi fechada pelo sistema operacional.");
    }

    try {
        registrarLogTerminal('⏳ Acordando a interface oculta do WhatsApp...');
        await client.pupPage.bringToFront().catch(() => {});
        
        await client.pupPage.evaluate(() => { window.focus(); }).catch(() => {});

        // Trava absoluta de segurança: Só prossegue quando o motor de envios (WWebJS) estiver vivo na página
        await client.pupPage.waitForFunction('window.WWebJS !== undefined', { timeout: 10000 });
        registrarLogTerminal('✅ Interface do WhatsApp injetada e pronta para disparos.');
    } catch (e) {
        console.log('[WHATSAPP] Falha ao despertar navegador:', e.message);
        throw new Error("A interface do WhatsApp congelou e não responde. Por favor, execute um Hard Reset.");
    }
};

console.log('[WHATSAPP] ⚙️ Chamando client.initialize()...');
client.initialize().catch(err => {
    console.error('[WHATSAPP] 🔥 Erro fatal ao inicializar o Puppeteer:', err.message);
});

// FUNÇÃO AUXILIAR: GERA VERSÕES DO NÚMERO (COM E SEM O 9º DÍGITO)
const gerarVersoesNumero = (numeroRaw) => {
    let num = String(numeroRaw).replace(/\D/g, '');
    if (!num) return [];
    
    if (!num.startsWith('55') && num.length >= 10) num = '55' + num;
    
    let versao1 = num;
    let versao2 = null;

    if (num.startsWith('55')) {
        const ddd = num.substring(2, 4);
        const resto = num.substring(4);
        
        if (parseInt(ddd) >= 11 && parseInt(ddd) <= 99) {
            if (resto.length === 9 && resto[0] === '9') {
                versao2 = '55' + ddd + resto.substring(1); 
            } else if (resto.length === 8) {
                versao2 = '55' + ddd + '9' + resto; 
            }
        }
    }
    
    return [versao1, versao2].filter(Boolean); 
};

// FUNÇÃO DE ENVIO CEGO E DIRETO COM PROTEÇÃO CONTRA DETACHED FRAME
const enviarMensagem = async (numero, mensagem, nomeCliente = 'Cliente', tentativa = 1) => {
    if (!verificarReady()) { 
        registrarLogTerminal('⚠️ WhatsApp ainda não está pronto. Mensagem ignorada.');
        return { success: false, error: "Servidor do WhatsApp não está conectado." };
    }

    const versoesParaTentar = gerarVersoesNumero(numero);
    if (versoesParaTentar.length === 0) return { success: false, error: "Número inválido ou em branco." };

    // Delay mais longo caso o robô esteja a tentar se recuperar de uma queda de Frame
    const delayBase = tentativa === 1 ? 1500 : 4000;
    await new Promise(resolve => setTimeout(resolve, delayBase));

    let disparou = false;
    let ultimoErro = null;

    for (let numVer of versoesParaTentar) {
        try {
            const chatId = numVer + "@c.us";

            if (tentativa > 1) {
                await client.pupPage.evaluate(() => 1).catch(() => {});
            }

            await client.sendMessage(chatId, mensagem);
            
            disparou = true;
            break; 
            
        } catch (error) {
            ultimoErro = error;
            if (error.message && (error.message.includes('LID') || error.message.includes('invalid number'))) {
                continue;
            } else {
                break;
            }
        }
    }

    if (disparou) {
        registrarLogTerminal(`✅ Mensagem enviada com sucesso para: ${nomeCliente} | ${numero}`);
        return { success: true };
    } else {
        const isDetached = ultimoErro && ultimoErro.message && (ultimoErro.message.includes('detached') || ultimoErro.message.includes('destroyed') || ultimoErro.message.includes('Target closed'));
        
        // Retry Block Inteligente: Tenta recuperar a tela caso o navegador a tenha suspendido
        if (isDetached && tentativa < 3) {
            registrarLogTerminal(`⚠️ Instabilidade no navegador (Detached Frame). Tentando recuperar aba para ${nomeCliente}... (Tentativa ${tentativa + 1}/3)`);
            try {
                if (client.pupPage && !client.pupPage.isClosed()) {
                    await client.pupPage.bringToFront().catch(() => {});
                    await client.pupPage.waitForFunction('window.WWebJS !== undefined', { timeout: 5000 }).catch(() => {});
                }
            } catch(e) {}
            
            return await enviarMensagem(numero, mensagem, nomeCliente, tentativa + 1);
        }

        if (ultimoErro && ultimoErro.message && ultimoErro.message.includes('LID')) {
            const erroPersonalizado = `Número inválido ou sem WhatsApp`;
            registrarLogTerminal(`❌ ${erroPersonalizado}: ${nomeCliente} | ${numero}`);
            return { success: false, error: erroPersonalizado };
        }

        const erroGenerico = ultimoErro ? ultimoErro.message : 'Erro Desconhecido';
        registrarLogTerminal(`❌ Falha ao enviar para: ${nomeCliente} | ${numero} - ${erroGenerico}`);
        return { success: false, error: erroGenerico };
    }
};

const verificarReady = () => {
    if (client && whatsappEstado.isReady) {
        return true;
    }
    return false;
};

const obterDadosMonitor = () => ({
    isReady: verificarReady(), 
    qrCodeBase64: whatsappEstado.ultimoQrCode,
    logs: whatsappEstado.logsTerminal
});

module.exports = { 
    client, 
    enviarMensagem,
    verificarReady,
    obterDadosMonitor,
    forcarResetEstadoManual,
    despertarNavegador
};