# Testes Automatizados

Este projeto inclui configurações para testes unitários (Jest) e testes de ponta a ponta (Maestro).

## 1. Testes Unitários (Jest)
Valida a lógica interna (TypeScript).

```bash
npm test
```
*Atualmente valida configurações básicas e suporte a TS.*

## 2. Testes de Ponta a Ponta (Maestro)
Simula um usuário real tocando na tela. Recomendado para apresentar no TCC.

### Pré-requisitos
1. Instale o [Maestro CLI](https://maestro.mobile.dev/).
2. Tenha o Emulador Android rodando o app (modo Development ou Build).

### Como Rodar
1. Inicie o app no Expo:
   ```bash
   npx expo start --android
   ```
2. Em outro terminal, rode o fluxo:
   ```bash
   maestro test maestro/flow.yaml
   ```

Isso fará o "robô" clicar nas telas automaticamente.
