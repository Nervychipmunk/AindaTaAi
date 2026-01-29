const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const timestamp = Date.now();
const hubEmail = `hub_${timestamp}@teste.com`;
const userEmail = `user_${timestamp}@teste.com`;

const flowTemplate = `appId: host.exp.exponent
---
- launchApp:
    clearState: false

# Esperar App Carregar
- assertVisible:
    text: "AindaTaAi"

# Fluxo de Login Hub
- tapOn: "Não tem conta? Cadastre-se"
- tapOn: "Nome Completo"
- inputText: "Hub Test User"
- tapOn: "Email"
- inputText: "${hubEmail}"
- tapOn: "Password"
- inputText: "123456"
- tapOn: "Cadastrar"
- assertVisible: "Quem é você?"
- tapOn: "Responsável (Hub)"
- assertVisible: "Meus Conectados"

# Logout
- tapOn:
    id: "logout-button"
- assertVisible: "Entrar"

# Fluxo Conectado
- tapOn: "Não tem conta? Cadastre-se"
- tapOn: "Nome Completo"
- inputText: "Connected Test User"
- tapOn: "Email"
- inputText: "${userEmail}"
- tapOn: "Password"
- inputText: "123456"
- tapOn: "Cadastrar"
- assertVisible: "Quem é você?"
- tapOn: "Conectado"
- assertVisible: "ESTOU BEM"

# Check-in
- tapOn: "ESTOU BEM"
- assertVisible: "Último check-in"
`;

const tempFlowPath = path.join(__dirname, '..', 'maestro', 'flow_run.yaml');
fs.writeFileSync(tempFlowPath, flowTemplate);

console.log('=== Teste E2E ===');
console.log(`Hub: ${hubEmail}`);
console.log(`User: ${userEmail}`);
console.log('Running Maestro...');

try {
    const maestroBat = path.resolve(__dirname, '..', '..', 'maestro_bin', 'maestro', 'bin', 'maestro.bat');
    execSync(`"${maestroBat}" test "${tempFlowPath}"`, { stdio: 'inherit' });
    console.log('✅ Teste E2E Passou!');
} catch (error) {
    console.error('❌ Teste E2E Falhou.');
    process.exit(1);
}
