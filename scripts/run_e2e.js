const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const timestamp = Date.now();
const hubEmail = `hub_${timestamp}@teste.com`;
const userEmail = `user_${timestamp}@teste.com`;

const scheduleTime = getScheduleTime();
const expoPort = findAvailablePort(8082);
const expoUrl = startExpoAndGetUrl(expoPort);
const includeFinalStage = false;

const finalStageFlow = `

# Conectado aguarda check-in
- tapOn: "Email"
- inputText: "${userEmail}"
- tapOn: "Password"
- inputText: "123456"
- tapOn: "Entrar"
- extendedWaitUntil:
    visible: "Check-ins Pendentes"
    timeout: 120000
- tapOn: "Confirmar"
- assertVisible: "Sucesso"
- tapOn: "OK"

# Hub verifica status
- tapOn:
    id: "logout-button"
- extendedWaitUntil:
    visible: "Entrar"
    timeout: 10000
- tapOn: "Email"
- inputText: "${hubEmail}"
- tapOn: "Password"
- inputText: "123456"
- tapOn: "Entrar"
- assertVisible: "Meus Conectados"
- assertVisible: "Check-in: confirmed"
`;

const flowTemplate = `appId: host.exp.exponent
---
- launchApp:
    clearState: true

# Fechar modais do Expo Go (camera/permissoes)
- runFlow:
    when:
      visible: "ALLOW"
    commands:
      - tapOn: "ALLOW"

- runFlow:
    when:
      visible: "Allow"
    commands:
      - tapOn: "Allow"

# Abrir o projeto no Expo Go
- openLink: "${expoUrl}"
- extendedWaitUntil:
    visible: "Entrar"
    timeout: 120000

# Se ja estiver logado, sair (fallback)
- runFlow:
    when:
      visible:
        id: "logout-button"
    commands:
      - tapOn:
          id: "logout-button"
      - extendedWaitUntil:
          visible: "Entrar"
          timeout: 30000

# Se estiver na selecao de perfil, sair
- runFlow:
    when:
      visible: "Escolher Hub"
    commands:
      - tapOn: "Sair"
      - extendedWaitUntil:
          visible: "Entrar"
          timeout: 10000

# Esperar App Carregar
- assertVisible: "Entrar"

# Fluxo de Login Hub
- tapOn:
    id: "signup-link"
- extendedWaitUntil:
    visible: "Criar Conta"
    timeout: 15000
- tapOn: "Nome Completo"
- inputText: "Hub Test User"
- tapOn: "Email"
- inputText: "${hubEmail}"
- tapOn: "Password"
- inputText: "123456"
- runFlow:
    when:
      visible: "OK"
    commands:
      - tapOn: "OK"
- tapOn: "Criar Conta"
- tapOn: "Cadastrar"
- extendedWaitUntil:
    visible: "Escolher Hub"
    timeout: 15000
- tapOn: "Escolher Hub"
- assertVisible: "Meus Conectados"

# Logout
- tapOn:
    id: "logout-button"
- extendedWaitUntil:
    visible: "Entrar"
    timeout: 10000

# Fluxo Conectado
- tapOn:
    id: "signup-link"
- extendedWaitUntil:
    visible: "Criar Conta"
    timeout: 15000
- tapOn: "Nome Completo"
- inputText: "Connected Test User"
- tapOn: "Email"
- inputText: "${userEmail}"
- tapOn: "Password"
- inputText: "123456"
- runFlow:
    when:
      visible: "OK"
    commands:
      - tapOn: "OK"
- tapOn: "Criar Conta"
- tapOn: "Cadastrar"
- extendedWaitUntil:
    visible: "Escolher Conectado"
    timeout: 15000
- tapOn: "Escolher Conectado"
- assertVisible: "Nenhum check-in pendente no momento."

# Logout
- tapOn:
    id: "logout-button"
- extendedWaitUntil:
    visible: "Entrar"
    timeout: 10000

# Hub envia convite
- tapOn: "Email"
- inputText: "${hubEmail}"
- tapOn: "Password"
- inputText: "123456"
- tapOn: "Entrar"
- assertVisible: "Meus Conectados"
- tapOn:
    id: "add-connection-fab"
- assertVisible: "Adicionar Conectado"
- tapOn: "Email do Conectado"
- inputText: "${userEmail}"
- hideKeyboard
- tapOn:
    id: "add-connection-submit"
- runFlow:
    when:
      visible: "Conexao adicionada!"
    commands:
      - tapOn: "OK"
- runFlow:
    when:
      visible: "Erro"
    commands:
      - tapOn: "OK"
      - tapOn: "Email do Conectado"
      - inputText: "${userEmail}"
      - hideKeyboard
      - tapOn:
          id: "add-connection-submit"
      - runFlow:
          when:
            visible: "Conexao adicionada!"
          commands:
            - tapOn: "OK"
- extendedWaitUntil:
    visible: "Convite pendente"
    timeout: 20000
- tapOn:
    id: "logout-button"
- extendedWaitUntil:
    visible: "Entrar"
    timeout: 10000

# Conectado aceita convite
- tapOn: "Email"
- inputText: "${userEmail}"
- tapOn: "Password"
- inputText: "123456"
- tapOn: "Entrar"
- extendedWaitUntil:
    visible: "Convite de Monitoramento"
    timeout: 30000
- tapOn: "Aceitar"
- extendedWaitUntil:
    visible: "Confirmar"
    timeout: 10000
- tapOn: "Confirmar"
- assertVisible: "Nenhum check-in pendente no momento."
- tapOn:
    id: "logout-button"
- extendedWaitUntil:
    visible: "Entrar"
    timeout: 10000

# Hub define horario diario
- tapOn: "Email"
- inputText: "${hubEmail}"
- tapOn: "Password"
- inputText: "123456"
- tapOn: "Entrar"
- assertVisible: "Meus Conectados"
- tapOn: "Definir horario"
- assertVisible: "Horario diario"
- tapOn: "Horario"
- inputText: "${scheduleTime}"
- tapOn:
    id: "save-schedule"
- tapOn:
    id: "logout-button"
- extendedWaitUntil:
    visible: "Entrar"
    timeout: 10000
${includeFinalStage ? finalStageFlow : ''}
`;

const tempFlowPath = path.join(__dirname, '..', 'maestro', 'flow_run.yaml');
fs.writeFileSync(tempFlowPath, flowTemplate);

console.log('=== Teste E2E ===');
console.log(`Hub: ${hubEmail}`);
console.log(`User: ${userEmail}`);
console.log(`Expo URL: ${expoUrl}`);
console.log('Running Maestro...');

try {
    const maestroBat = resolveMaestroBat();
    const deviceId = getDeviceId();
    execSync(`"${maestroBat}" test "${tempFlowPath}" --device "${deviceId}"`, { stdio: 'inherit' });
    console.log('✅ Teste E2E Passou!');
} catch (error) {
    console.error('❌ Teste E2E Falhou.');
    process.exit(1);
}

function startExpoAndGetUrl(port) {
    const repoRoot = path.join(__dirname, '..');
    const logPath = path.join(repoRoot, 'expo.log');
    const logFd = fs.openSync(logPath, 'w');

    const expoArgs = [
        '/c',
        `npx expo start --lan --port ${port}`
    ];

    spawn('cmd', expoArgs, {
        cwd: repoRoot,
        stdio: ['ignore', logFd, logFd],
        windowsHide: true,
    });

    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
        if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, 'utf8');
            const match = content.match(/exps?:\/\/\S+/);
            if (match) {
                return match[0].replace(/\x1b\[[0-9;]*m/g, '').replace(/[)\]]+$/, '');
            }

            const portMatch = content.match(/Waiting on http:\/\/localhost:(\d+)/);
            if (portMatch) {
                const deviceIp = getDeviceIp();
                const hostIp = getHostIp(deviceIp);
                return `exp://${hostIp}:${portMatch[1]}`;
            }
        }
        sleep(1000);
    }

    throw new Error('Expo URL not found. Check expo.log for details.');
}

function getDeviceId() {
    try {
        const output = execSync('adb devices', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
        const lines = output.split(/\r?\n/).filter((line) => line && !line.startsWith('List of devices'));
        const deviceLine = lines.find((line) => line.includes('\tdevice'));
        if (!deviceLine) throw new Error('No device found');
        return deviceLine.split('\t')[0].trim();
    } catch (err) {
        throw new Error('ADB device not found. Ensure device is connected and authorized.');
    }
}

function getDeviceIp() {
    try {
        const output = execSync('adb shell ip route', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
        const match = output.match(/src (\d+\.\d+\.\d+\.\d+)/);
        if (!match) {
            throw new Error('Device IP not found');
        }
        return match[1];
    } catch (err) {
        throw new Error('Unable to read device IP. Ensure adb is connected.');
    }
}

function getHostIp(deviceIp) {
    const prefix = deviceIp.split('.').slice(0, 3).join('.') + '.';
    const output = execSync('ipconfig', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    const ipMatches = output.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g) || [];
    const candidates = ipMatches.filter((ip) => !ip.startsWith('127.') && !ip.startsWith('169.254.'));

    const match = candidates.find((ip) => ip.startsWith(prefix));
    if (match) return match;

    const fallback = candidates.find((ip) => ip !== '127.0.0.1');
    if (fallback) return fallback;

    throw new Error('Host IP not found. Check ipconfig output.');
}

function findAvailablePort(startPort) {
    for (let port = startPort; port < startPort + 50; port += 1) {
        if (!isPortInUse(port)) return port;
    }
    throw new Error('No available port found for Expo.');
}

function isPortInUse(port) {
    try {
        const output = execSync(`netstat -ano | findstr :${port}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
        return output.trim().length > 0;
    } catch (err) {
        return false;
    }
}

function sleep(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        // busy wait
    }
}

function getScheduleTime() {
    const now = new Date();
    const target = new Date(now.getTime() + 60 * 1000);
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(target);
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
    return `${hour}:${minute}`;
}

function resolveMaestroBat() {
    const candidates = [
        path.resolve(__dirname, '..', '..', 'maestro_bin', 'maestro', 'bin', 'maestro.bat'),
        'c:\\repoTCC\\maestro_bin\\maestro\\bin\\maestro.bat',
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    throw new Error('maestro.bat not found. Install Maestro or update the path.');
}
