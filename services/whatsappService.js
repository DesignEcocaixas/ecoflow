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

// FUNÇÃO AUXILIAR: GERA VERSÕES DO NÚMERO PARA LHE DAR COM O 9º DÍGITO
const gerarVersoesNumero = (numeroRaw) => {
    let num = String(numeroRaw).replace(/\D/g, '');
    if (!num) return [];
    
    // Adiciona DDI se faltar
    if (!num.startsWith('55') && num.length >= 10) num = '55' + num;
    
    let versao1 = num;
    let versao2 = null;

    if (num.startsWith('55')) {
        const ddd = num.substring(2, 4);
        const resto = num.substring(4);
        
        // Aplica regra de 9º dígito apenas para números móveis do Brasil (DDD 11 a 99)
        if (parseInt(ddd) >= 11 && parseInt(ddd) <= 99) {
            if (resto.length === 9 && resto[0] === '9') {
                versao2 = '55' + ddd + resto.substring(1); // Ex: Transforma 5571999357602 em 557199357602 (Sem o 9 inicial)
            } else if (resto.length === 8) {
                versao2 = '55' + ddd + '9' + resto; // Ex: Transforma 557199357602 em 5571999357602 (Com o 9 inicial)
            }
        }
    }
    
    return [versao1, versao2].filter(Boolean); // Retorna array apenas com versões válidas
};

// FUNÇÃO DE ENVIO REESCRITA COM AVALIADOR DE DÍGITO
const enviarMensagem = async (numero, mensagem, nomeCliente = 'Cliente', tentativa = 1) => {
    if (!verificarReady()) { 
        registrarLogTerminal('⚠️ WhatsApp ainda não está pronto. Mensagem ignorada.');
        return false;
    }

    const versoesParaTentar = gerarVersoesNumero(numero);
    if (versoesParaTentar.length === 0) return false;

    // Timeout de estabilização do navegador
    const delayBase = tentativa === 1 ? 1500 : 3500;
    await new Promise(resolve => setTimeout(resolve, delayBase));

    let disparou = false;
    let ultimoErro = null;

    // Loop Inteligente: Testa o número com o 9 e sem o 9
    for (let numVer of versoesParaTentar) {
        try {
            let chatId;
            // Valida na base da Meta para qual versão o WhatsApp do cliente foi registrado
            const numberId = await client.getNumberId(numVer);
            
            if (numberId) {
                chatId = numberId._serialized;
            } else {
                chatId = numVer + "@c.us";
            }

            // Respiro pro DOM do WhatsApp antes de enviar
            await new Promise(resolve => setTimeout(resolve, 800));

            await client.sendMessage(chatId, mensagem);
            
            disparou = true;
            break; // Sai do for, enviou com sucesso!
            
        } catch (error) {
            ultimoErro = error;
            // Se o erro for de "LID" (usuário inexistente), apenas pula e tenta a outra variação numérica
            if (error.message && error.message.includes('LID')) {
                continue;
            } else {
                // Se for outro erro de Puppeteer (Detached Frame), quebra o for para usar o retry externo
                break;
            }
        }
    }

    if (disparou) {
        registrarLogTerminal(`✅ Mensagem enviada com sucesso para: ${nomeCliente} | ${numero}`);
        return true;
    } else {
        // Trata os erros finais caso nenhuma variação de número tenha funcionado
        if (ultimoErro && ultimoErro.message && (ultimoErro.message.includes('detached Frame') || ultimoErro.message.includes('Execution context was destroyed')) && tentativa < 3) {
            registrarLogTerminal(`⚠️ Frame instável detectado para ${nomeCliente}. Reorganizando contexto interno... (Tentativa ${tentativa + 1}/3)`);
            try {
                if (client.pupPage) await client.pupPage.bringToFront().catch(() => {});
            } catch(e) {}
            
            await new Promise(resolve => setTimeout(resolve, 4000)); 
            return await enviarMensagem(numero, mensagem, nomeCliente, tentativa + 1);
        }

        if (ultimoErro && ultimoErro.message && ultimoErro.message.includes('LID')) {
            registrarLogTerminal(`❌ Número inválido/inexistente no WhatsApp: ${nomeCliente} | ${numero}`);
            return false;
        }

        registrarLogTerminal(`❌ Erro crítico ao enviar para: ${nomeCliente} | ${numero} - ${ultimoErro ? ultimoErro.message : 'Erro Desconhecido'}`);
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