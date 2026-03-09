# Painel Reise (Front) - Dashboard Gerencial

Front-end do Dashboard Gerencial da Reise em **React + Vite**.  
Este projeto consome a API do SSOT (Cloud Run) e **não acessa BigQuery direto no browser**.

## Stack
- React + Vite
- CSS (tema da marca Reise)
- Consumo via HTTP (JSON) da SSOT API

## Requisitos
- Node.js 18+ (recomendado 20)
- NPM

## Configuração (local)
1) Instale as dependências:
```bash
npm install
```

2) Crie o arquivo `.env.local` na raiz do projeto:
```bash
VITE_SSOT_API_BASE_URL=https://SUA_URL_DO_CLOUD_RUN
```

3) Suba o projeto:
```bash
npm run dev
```

Acesse:
- http://localhost:5173

## Variáveis de ambiente
Este projeto usa variáveis do Vite (prefixo `VITE_`).

- `VITE_SSOT_API_BASE_URL`  
  URL base da SSOT API (Cloud Run). Exemplo:
  `https://ssot-api-xxxxxx.us-central1.run.app`

Há um arquivo `.env.example` no repo.

## Arquitetura (alto nível)
- UI “SaaS-like” com sidebar + topbar
- Página principal atual: **Gestão (Shopify-like)**:
  - KPIs (Performance) com comparação vs período anterior
  - Evolução de jornada (Sessões → Carrinho → Checkout → Pedidos válidos)
  - Canais (Top 5 + modal “Ver tudo”)

Fonte de dados: SSOT API (`/v1/shopify/gestao`).

## Nomenclaturas (padronizadas)
- “Pedidos válidos” = pedidos aprovados válidos (SSOT)
- “Ticket médio” = AOV (receita/pedidos)
- Sessões oficiais do dashboard seguem a regra definida na API (ver README da API)

## Scripts úteis
- `npm run dev` - ambiente local
- `npm run build` - build de produção
- `npm run preview` - preview do build

## Segurança
- Não commitar `.env` / `.env.local`
- Não guardar credenciais no front
- Acesso a dados sempre via API

## Roadmap (próximas visões)
- Tráfego (Device, Referrer, Landing, Geo)
- Recorrência (novos vs recorrentes, evolução)
- Produto e cupons (quando marts estiverem prontos no SSOT)
- Spend/ROAS/CPA por canal (futuro)
