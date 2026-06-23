const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Importa a view dedicada que criámos
const renderTestesView = require('../views/testesView');

// ============================================================================
// PAINEL DE TESTES DE ROTAS (SWAGGER INTERNO) - OTIMIZADO PARA ECOFLOW
// ============================================================================
router.get('/dev/testes', (req, res) => {
    // Segurança: Apenas Administradores
    if (!req.session || !req.session.user || req.session.user.tipo_usuario !== 'admin') {
        return res.redirect("/login");
    }

    const routesDir = __dirname;
    const appJsPath = path.join(__dirname, '..', 'app.js'); // Caminho para o app.js
    const rotasEncontradas = [];
    const prefixMap = {}; 

    // 1. Escaneia o app.js para descobrir os prefixos automaticamente
    if (fs.existsSync(appJsPath)) {
        const appContent = fs.readFileSync(appJsPath, 'utf-8');
        
        // Expressões regulares para mapear os ficheiros importados e os seus prefixos
        const requireRegex = /(?:const|let|var)\s+(\w+)\s*=\s*require\(['"]\.\/routes\/([^'"]+)['"]\)/g;
        let reqMatch;
        const fileToVar = {}; 
        while ((reqMatch = requireRegex.exec(appContent)) !== null) {
            const varName = reqMatch[1];
            const fileName = reqMatch[2].endsWith('.js') ? reqMatch[2] : reqMatch[2] + '.js';
            fileToVar[varName] = fileName;
        }

        const useRegex = /app\.use\(['"]([^'"]+)['"]\s*,\s*(\w+)\)/g;
        let useMatch;
        while ((useMatch = useRegex.exec(appContent)) !== null) {
            const prefix = useMatch[1];
            const varName = useMatch[2];
            
            if (fileToVar[varName]) {
                const fileName = fileToVar[varName];
                prefixMap[fileName] = prefix === '/' ? '' : prefix; 
            }
        }
    }

    // 2. Coleta os dados das rotas e scaneia o corpo (req.body) em todos os ficheiros da pasta routes
    if (fs.existsSync(routesDir)) {
        const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
        
        files.forEach(file => {
            const content = fs.readFileSync(path.join(routesDir, file), 'utf-8');
            const regex = /router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']([\s\S]*?)(?=router\.(get|post|put|delete|patch)|module\.exports|$)/g;
            let match;
            
            const prefixoDetectado = prefixMap[file] !== undefined ? prefixMap[file] : '';

            while ((match = regex.exec(content)) !== null) {
                const metodo = match[1].toUpperCase();
                const rota = match[2];
                const blockCode = match[3]; 

                let payloadJson = "";

                // Tenta inferir o formato do JSON analisando as variáveis utilizadas no req.body
                if (['POST', 'PUT', 'PATCH'].includes(metodo)) {
                    const fields = new Set();
                    const destructuringMatch = blockCode.match(/\{\s*([^}]+)\s*\}\s*=\s*req\.body/);
                    if (destructuringMatch) {
                        const vars = destructuringMatch[1].split(',').map(v => v.split('=')[0].trim().replace(/[^a-zA-Z0-9_]/g, ''));
                        vars.forEach(v => { if (v) fields.add(v); });
                    }
                    const dotRegex = /req\.body\.([a-zA-Z0-9_]+)/g;
                    let dotMatch;
                    while ((dotMatch = dotRegex.exec(blockCode)) !== null) {
                        fields.add(dotMatch[1]);
                    }
                    if (fields.size > 0) {
                        const obj = {};
                        fields.forEach(f => obj[f] = ""); 
                        payloadJson = JSON.stringify(obj, null, 2);
                    } else {
                        payloadJson = '{\n  "campo": "valor"\n}';
                    }
                }

                // Extração dos parâmetros da URL (ex: :id, :token)
                const params = [];
                const paramsMatch = rota.match(/:[a-zA-Z0-9_]+/g);
                if (paramsMatch) {
                    paramsMatch.forEach(p => params.push(p));
                }

                rotasEncontradas.push({
                    id: Math.random().toString(36).substr(2, 9),
                    arquivo: file,
                    grupo: file.replace('.js', '').toUpperCase(),
                    metodo: metodo,
                    rota: rota,
                    prefixoAuto: prefixoDetectado,
                    payloadDefault: payloadJson,
                    params: params
                });
            }
        });
    }

    // 3. Renderiza a View dedicada enviando o utilizador logado e o array de rotas
    const html = renderTestesView(req.session.user, rotasEncontradas);
    res.send(html);
});

module.exports = router;