# AindaTaAi

Aplicativo de monitoramento de segurança pessoal onde **Conectados** confirmam periodicamente seu bem-estar para **Responsáveis** (Hubs). Se um check-in não for confirmado a tempo, o Hub é notificado imediatamente.

## 📱 Tecnologias

- **Frontend**: React Native (Expo SDK 54)
- **Linguagem**: TypeScript
- **Estado Global**: Zustand
- **Backend (BaaS)**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **UI**: React Native Paper + Lucide Icons
- **Autenticação biométrica**: expo-local-authentication
- **Push Notifications**: expo-notifications

## 🚀 Como Rodar

### Pré-requisitos

- Node.js (v18+)
- Conta no [Supabase](https://supabase.com)
- Expo Go instalado no celular (ou Emulador Android/iOS)

### Instalação

1. Clone o repositório e instale as dependências:
   ```bash
   npm install
   ```

2. **Configuração do Supabase**:
   - Crie um projeto no Supabase.
   - Rode o script `setup_database.sql` no SQL Editor para criar as tabelas.
   - Para bases já existentes, rode também:
     - `migration_add_schedule.sql` (horário diário + políticas)
     - `migration_add_notifications.sql` (fila de push + triggers)
     - `migration_add_token.sql` (push_token no perfil)
   - Agendamento automático — configure um cron para executar:
     - `select public.create_daily_checkins();`
     - `select public.mark_overdue_checkins();`
   - Push (Edge Function):
     - Deploy da função `process-notifications` (pasta `supabase/functions/process-notifications`).
     - Habilite a extensão `pg_net`.
     - Crie um job HTTP (POST) para `https://<seu-projeto>.functions.supabase.co/process-notifications`.
   - Fuso padrão: `America/Sao_Paulo`.
   - Edite `src/lib/supabase.ts` com suas chaves:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`

3. **Executar**:
   ```bash
   npx expo start
   ```
   Escaneie o QR Code com o Expo Go (Android/iOS).

## 📂 Estrutura do Projeto

```
src/
├── screens/          # Telas (Auth, Dashboard, Check-in, Role Selection)
├── navigation/       # Configuração de rotas
├── store/            # Estado global (Auth, Check-in, Conexões, Monitoramento)
├── services/         # Interação com APIs
├── lib/              # Configurações (Supabase)
└── types/            # Tipos TypeScript
```

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes E2E (Maestro)
npm run e2e
```

## ✅ Features

- Autenticação (Login / Cadastro)
- Seleção de Perfil (Hub vs Conectado)
- Conexão entre Hub e Usuário
- Check-in com Confirmação Biométrica
- Monitoramento em Tempo Real
- Notificações Push de Atraso

## 📄 Licença

Projeto acadêmico — PUC-RS.
