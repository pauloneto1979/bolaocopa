# BolaoCopa Backend

Backend em Node.js, Express, PostgreSQL e Prisma para gerenciar um bolao da Copa do Mundo.

## Estrutura

```text
prisma/schema.prisma       Modelo do banco
src/app.js                 Configuracao do Express
src/controllers            Entrada HTTP
src/routes                 Rotas REST
src/services               Regras de negocio
src/jobs                   Job cron de sincronizacao
src/config/prisma.js       Cliente Prisma
```

## Rodar no Windows

1. Instale dependencias:

```powershell
npm install
```

2. Crie o arquivo `.env` a partir do exemplo:

```powershell
copy .env.example .env
```

3. Configure `DATABASE_URL` no `.env`, por exemplo:

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bolaocopa?schema=public"
```

4. Crie o banco `bolaocopa` no PostgreSQL.

5. Gere o Prisma Client e rode a migracao:

```powershell
npx prisma generate
npx prisma migrate dev --name init
```

6. Inicie a API:

```powershell
npm run dev
```

ou:

```powershell
npm start
```

A API ficara em:

```text
http://localhost:3000
```

## Rotas

```http
POST /users
GET /users
POST /games/sync
GET /games
PUT /games/:id/result
POST /bets
GET /bets/user/:id
GET /ranking
GET /prizes
```

## Exemplos

Criar usuario:

```json
{
  "name": "Paulo",
  "email": "paulo@email.com"
}
```

Criar aposta:

```json
{
  "userId": "uuid-do-usuario",
  "gameId": "uuid-do-jogo",
  "homeScore": 2,
  "awayScore": 0
}
```

Atualizar resultado manualmente:

```json
{
  "homeScore": 2,
  "awayScore": 0
}
```

## API-Football

Configure no `.env`:

```text
API_FOOTBALL_KEY="sua_chave"
API_FOOTBALL_LEAGUE_ID=1
API_FOOTBALL_SEASON=2026
```

O job automatico roda a cada 5 minutos quando a chave da API-Football esta configurada. Sem a chave, a API local continua funcionando e o job fica pausado.
