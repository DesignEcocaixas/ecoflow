// services/whatsappService.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal'); // Renomeado para não conflitar com o pacote de imagem
const QRCode = require('qrcode'); // Usa a lib de QR Code que você já tem instalada

console.log('[WHATSAPP] 🚀 Inicializando módulo do serviço...');

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
            '--disable-extensions', // Evita o carregamento de extensões do Chrome que consomem memória
            
            // 🚀 FLAGS ADICIONADAS PARA IMPEDIR TRAVAS DE ARQUIVO (WINDOWS/ONEDRIVE) Sem corromper o cache dos chats
            '--disable-features=FirstPartySets',         // Desativa o recurso que gera o arquivo first_party_sets.db
            '--disable-features=PrivacySandboxSettings4', // Bloqueia journals de telemetria de privacidade
            '--disable-gpu'                               // Desativa aceleração de hardware que pode reter processos no Windows
        ]
    }
});

// Estado expandido para o painel de monitoramento
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

// 1. LOG DE CARREGAMENTO INICIAL
client.on('loading_screen', (percent, message) => {
    registrarLogTerminal(`⏳ Carregando: ${percent}% - ${message}`);
});

// 2. LOG DO QR CODE (ATUALIZADO COM A SUA LIB RECENTE)
client.on('qr', async (qr) => {
    // Mantém a exibição original no terminal do VSCode/PM2
    console.log('\n==================================================');
    console.log('🤖 SCANNEIE O QR CODE ABAIXO COM O WHATSAPP DA EMPRESA');
    console.log('==================================================\n');
    qrcodeTerminal.generate(qr, { small: true });

    // Gera a versão DataURL (Base64) usando a biblioteca 'qrcode' instalada
    try {
        whatsappEstado.ultimoQrCode = await QRCode.toDataURL(qr);
    } catch (errQr) {
        console.error('[WHATSAPP] Erro ao converter QR para DataURL:', errQr.message);
    }
});

// 3. LOG DE AUTENTICAÇÃO SUCESSO
client.on('authenticated', () => {
    whatsappEstado.ultimoQrCode = null; // Limpa o QR anterior pois já logou
    registrarLogTerminal('🔑 Autenticado com sucesso! Sincronizando e carregando conversas...');
});

// 4. LOG DE BOT PRONTO
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
    whatsappEstado.ultimoQrCode = null; // Garante a limpeza do estado para gerar um novo
    registrarLogTerminal(`❌ O WhatsApp foi desconectado pelo usuário ou dispositivo: ${reason}`);
});

// FUNÇÃO AUXILIAR EXPONDENDO LIMPEZA MANUAL DE SESSÃO SEM TRAVAR REFERÊNCIAS
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

const enviarMensagem = async (numero, mensagem, nomeCliente = 'Cliente') => {
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

        const numberId = await client.getNumberId(numeroLimpo);
        
        let chatId;
        if (numberId) {
            chatId = numberId._serialized;
        } else {
            chatId = numeroLimpo + "@c.us";
        }

        await client.sendMessage(chatId, mensagem);
        // ✨ Aqui alteramos para enviar o Nome do Cliente e o Número original para o log do Front ler
        registrarLogTerminal(`✅ Mensagem enviada com sucesso para: ${nomeCliente} | ${numero}`);
        return true;
    } catch (error) {
        // ✨ Garantir que o erro também contenha a nova formatação
        registrarLogTerminal(`❌ Erro crítico ao enviar para: ${nomeCliente} | ${numero} - ${error.message}`);
        return false;
    }
};

// BLINDAGEM DE ESTADO: Evita falso-negativo se o Puppeteer ocultar a referência pupPage temporariamente
const verificarReady = () => {
    if (client && whatsappEstado.isReady) {
        return true;
    }
    return false;
};

// Novo método exposto para alimentar o endpoint /api/whatsapp/status-monitor
const obterDadosMonitor = () => ({
    isReady: verificarReady(), // Sempre chama a validação em tempo real para não reter cache
    qrCodeBase64: whatsappEstado.ultimoQrCode,
    logs: whatsappEstado.logsTerminal
});

module.exports = { 
    client, // Exportação mantida e visível para as rotas administrativas de re-boot
    enviarMensagem,
    verificarReady,
    obterDadosMonitor,
    forcarResetEstadoManual
};