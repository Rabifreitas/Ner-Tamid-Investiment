# Ner Tamid Eternal Insights 🕎

> **"A Luz Eterna que guia investimentos com propósito"**

Uma plataforma autônoma de gestão de investimentos com IA avançada e **alocação automática de 20% para caridade**.

## ✨ Características Principais

- 🎯 **Motor de Caridade Automática**: 10% de todos os lucros realizados são automaticamente alocados para causas sociais
- 📊 **Dashboard Inteligente**: Visualização completa do portfólio e impacto social
- 🌳 **Árvore da Caridade**: Visualização 3D interativa do crescimento do seu impacto
- 🔗 **Transparência Blockchain**: Registro imutável de todas as doações
- 🎨 **Design "Luz Eterna"**: Interface elegante com tema azul profundo e dourado

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Instalação

```bash
# Clone o repositório
git clone https://github.com/your-org/ner-tamid-eternal-insights.git
cd ner-tamid-eternal-insights

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env
# Edite .env com suas configurações

# Inicie o banco de dados
npm run db:setup

# Inicie o desenvolvimento
npm run dev
```

## 📁 Estrutura do Projeto

```
├── client/          # Frontend React + TypeScript
├── server/          # Backend Node.js + Express
├── blockchain/      # Smart Contracts (Solidity)
└── docs/            # Documentação
```

## 💝 Motor de Caridade (Core)

O coração ético da plataforma. **Cada centavo de lucro realizado automaticamente aloca 10% para caridade** antes de qualquer distribuição.

```typescript
// A regra de ouro - NUNCA menos que 10%
const charityAmount = realizedProfit * 0.10;
```

## 🎨 Tema Visual

| Cor | Hex | Uso |
|-----|-----|-----|
| Azul Profundo | `#0A1A3A` | Background principal |
| Dourado | `#D4AF37` | Destaques e acentos |
| Roxo Régio | `#6A0DAD` | Gradientes |
| Verde Esmeralda | `#028A0F` | Caridade e crescimento |

## 📜 Licença

Proprietary - Todos os direitos reservados

---

> Feito com ❤️ e propósito | `#NerTamidEternal`
