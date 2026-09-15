// services/whatsappService.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');

console.log('[WHATSAPP] 🚀 Inicializando módulo do serviço...');

// Aumento global de listeners para evitar memory leaks em loops de disparo do express
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
            '--single-process',
            '--disable-extensions', 
            '--disable-features=FirstPartySets',         
            '--disable-features=PrivacySandboxSettings4', 
            '--disable-gpu'                               
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

client.on('loading_screen', (percent, message) => {
    registrarLogTerminal(`⏳ Carregando: ${percent}% - ${message}`);
});

client.on('qr', async (qr) => {
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
    registrarLogTerminal('🔑 Autenticado com sucesso! Sincronizando e carregando conversas...');
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
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    whatsappEstado.logsTerminal.push(`[${timestamp}] 🔌 Limpando sessão antiga... Inicializando folha limpa de navegação.`);
};

console.log('[WHATSAPP] ⚙️ Chamando client.initialize()...');
client.initialize().catch(err => {
    console.error('[WHATSAPP] 🔥 Erro fatal ao inicializar o Puppeteer:', err.message);
});

// FUNÇÃO DE ENVIO REESCRITA (RESOLVENDO O 9º DÍGITO COM BLINDAGEM DE RETRY)
const enviarMensagem = async (numero, mensagem, nomeCliente = 'Cliente', tentativa = 1) => {
    if (!verificarReady()) { 
        registrarLogTerminal('⚠️ WhatsApp ainda não está pronto. Mensagem ignorada.');
        return false;
    }

    try {
        let numeroLimpo = String(numero).replace(/\D/g, '');
        if (!numeroLimpo) return false;

        if (!numeroLimpo.startsWith('55') && numeroLimpo.length >= 10) {
            numeroLimpo = '55' + numeroLimpo;
        }

        // Timeout dinâmico: na primeira tentativa espera pouco, nas re-tentativas aguarda mais para a tela estabilizar
        const delayBase = tentativa === 1 ? 1500 : 3500;
        await new Promise(resolve => setTimeout(resolve, delayBase));

        // 🛡️ REINSERINDO O getNumberId(): 
        // No Brasil, devido à regra do 9º dígito, enviar para o @c.us diretamente causa "No LID for user".
        // O getNumberId pergunta à base da Meta qual é o ID exato (com ou sem o 9) daquele contato.
        let chatId;
        const numberId = await client.getNumberId(numeroLimpo);
        
        if (numberId) {
            chatId = numberId._serialized;
        } else {
            chatId = numeroLimpo + "@c.us";
        }

        // Antes de injetar o chat no WWebJS, respira rapidamente
        await new Promise(resolve => setTimeout(resolve, 800));

        await client.sendMessage(chatId, mensagem);
        
        registrarLogTerminal(`✅ Mensagem enviada com sucesso para: ${nomeCliente} | ${numero}`);
        return true;
        
    } catch (error) {
        // 🛡️ Lógica Definitiva para Detached Frame E No LID
        if (error.message && (error.message.includes('detached Frame') || error.message.includes('Execution context was destroyed') || error.message.includes('LID')) && tentativa < 3) {
            
            const tipoErro = error.message.includes('LID') ? 'Sincronização de Contato' : 'Frame do Navegador';
            registrarLogTerminal(`⚠️ Instabilidade (${tipoErro}) para ${nomeCliente}. Restaurando... (Tentativa ${tentativa + 1}/3)`);
            
            try {
                // Traz a página para foco para acordar os frames
                if (client.pupPage) {
                    await client.pupPage.bringToFront().catch(() => {});
                }
            } catch(e) {}
            
            // Aguarda 4 segundos rigorosos para o WWebJS e o Puppeteer restaurarem as referências
            await new Promise(resolve => setTimeout(resolve, 4000)); 
            
            return await enviarMensagem(numero, mensagem, nomeCliente, tentativa + 1);
        }

        registrarLogTerminal(`❌ Erro crítico ao enviar para: ${nomeCliente} | ${numero} - ${error.message}`);
        return false;
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
    forcarResetEstadoManual
};