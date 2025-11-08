# StreamHub - Plataforma de Streaming

Uma plataforma de streaming moderno estilo HBO Max/Prime Video com suporte a canais de TV, filmes e séries, construída com React, TypeScript e Supabase.

## Características Principais

### Para Usuários
- **Autenticação segura** com email e senha via Supabase Auth
- **Seleção de plano** ao registrar (Free, Basic, Premium)
- **Sistema de créditos** para assistir conteúdo
- **Visualização de canais de TV aberta** brasileiros
- **Catálogo de filmes e séries** com pôsteres
- **Histórico de assistência** registrado
- **Interface estilo HBO Max/Prime Video** com tema escuro

### Para Administradores
- **Painel Admin completo** para gerenciar:
  - Usuários e seus planos
  - Canais de TV
  - Conteúdo (filmes e séries)
- **CRUD de canais**: adicionar, editar, deletar
- **CRUD de conteúdo**: adicionar, editar, deletar
- **Visualização de usuários** e status de admin

## Tecnologia Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Build Tool**: Vite

## Estrutura do Banco de Dados

### Tabelas Principais

#### `organizations`
- Empresas/plataformas (uma por padrão: StreamHub)
- Campos: id, name, slug, logo_url, theme_color

#### `users`
- Usuários do sistema
- Campos: id, email, full_name, organization_id, is_admin, avatar_url

#### `subscription_plans`
- Planos de assinatura por organização
- Campos: id, name, price_monthly, max_credits, max_simultaneous_streams, hd_quality

#### `user_subscriptions`
- Assinaturas ativas do usuário
- Campos: user_id, plan_id, status, current_credits, monthly_credits_limit

#### `channels`
- Canais de TV
- Campos: id, name, category, stream_url, logo_url, credits_cost, display_order

#### `content`
- Filmes e séries
- Campos: id, type (movie/series/episode), title, description, poster_url, credits_cost

#### `user_credits`
- Histórico de transações de créditos

#### `watch_history`
- Histórico de visualização

## Planos de Assinatura

| Plano | Preço | Créditos | Funcionalidades |
|-------|-------|----------|-----------------|
| Free | Grátis | 10 | Canais básicos |
| Basic | R$ 9,90/mês | 50 | Canais + alguns filmes |
| Premium | R$ 29,90/mês | 200 | Tudo desbloqueado |

## Como Usar

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

O app estará disponível em `http://localhost:5173`

### Build para Produção

```bash
npm run build
```

### Verificação de Tipos

```bash
npm run typecheck
```

## Fluxo de Uso

### 1. Registro
- Usuário cria conta com email, senha e nome
- Seleciona um plano de assinatura
- Recebe créditos iniciais conforme o plano

### 2. Consumo
- Acessa a biblioteca de canais e conteúdo
- Visualiza pôsteres e informações
- Consome créditos ao assistir

### 3. Admin
- Clica em ícone de configurações
- Acessa painel admin
- Gerencia canais, conteúdo e usuários

## Canais Pré-Configurados

- **Pluto TV Brasil** (0 créditos)
- **NetMovies** (5 créditos)
- **Runtime** (0 créditos)
- **Filmelier** (3 créditos)

## Conteúdo Pré-Configurado

- 5 títulos de exemplo (filmes e séries)
- Sistema de custo de créditos por conteúdo
- Categorias: Drama, Ficção Científica, Suspense, Comédia, Ação

## Segurança

- **Row Level Security (RLS)** em todas as tabelas
- Usuários veem apenas:
  - Seu próprio perfil
  - Conteúdo da sua organização
  - Seu histórico de visualização
- Admins têm acesso completo
- Senhas são hasheadas via Supabase Auth

## Personalização

### Adicionar Novo Canal
1. Ir para Painel Admin
2. Aba "Canais"
3. Clicar "Novo Canal"
4. Preencher dados e criar

### Adicionar Novo Conteúdo
1. Ir para Painel Admin
2. Aba "Conteúdo"
3. Clicar "Novo Conteúdo"
4. Preencher dados e criar

### Modificar Planos
- Editar diretamente no banco via Supabase Dashboard

## Variáveis de Ambiente

```
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

Estas são carregadas automaticamente do arquivo `.env`

## Próximas Melhorias

- [ ] Sistema de pagamento integrado
- [ ] Player de vídeo customizado
- [ ] Recomendações inteligentes
- [ ] Modo offline com cache
- [ ] App nativa (React Native)
- [ ] Suporte a múltiplos idiomas

## Licença

MIT
