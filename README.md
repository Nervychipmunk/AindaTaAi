# AindaTaAi - Safety Check-in App (MVP TCC)

Aplicativo de monitoramento de segurança pessoal onde "Conectados" confirmam periodicamente seu bem-estar para "Responsáveis" (Hubs). Desenvolvido como MVP para Trabalho de Conclusão de Curso.

## 📱 Tecnologias

- **Frontend**: React Native (via Expo SDK 50+)
- **Linguagem**: TypeScript
- **Estado Global**: Zustand
- **Backend (BaaS)**: Supabase (PostgreSQL, Auth, Realtime)
- **UI**: React Native Paper + Lucide Icons

## 🚀 Como Rodar

### Pré-requisitos
- Node.js (v18+)
- Conta no [Supabase](https://supabase.com)
- Expo Go instalado no celular (ou Emulador Android/iOS)

### Instalação

1. **Clone o repositório** e instale as dependências:
   ```bash
   npm install
   ```

2. **Configuração do Supabase**:
   - Crie um projeto no Supabase.
   - Rode o script `setup_database.sql` (na raiz do projeto) no SQL Editor do Supabase para criar as tabelas.
   - Edite o arquivo `src/lib/supabase.ts` com suas chaves:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`

3. **Executar**:
   ```bash
   npx expo start
   ```
   - Escaneie o QR Code com o app Expo Go (Android/iOS).

## 📂 Estrutura do Projeto

- `src/screens`: Telas do aplicativo (Login, Dashboard, Check-in).
- `src/navigation`: Configuração de rotas (Login -> Logado).
- `src/store`: Gerenciamento de estado global (Auth, Dados).
- `src/services`: Funções de interação com APIs (não implementado ainda, usando direto no componente por enquanto).
- `src/lib`: Configurações de bibliotecas (Supabase).
- `src/types`: Definições de Tipos TypeScript (Interfaces de Banco de Dados).

## ✅ Features (MVP)

- [x] Autenticação (Login/Cadastro)
- [x] Seleção de Perfil (Hub vs Conectado)
- [ ] Conexão entre Hub e Usuário
- [ ] Check-in com Confirmação Biométrica
- [ ] Monitoramento em Tempo Real
- [ ] Notificações de Atraso

## 📄 Licença

Projeto acadêmico - PUC-RS.
