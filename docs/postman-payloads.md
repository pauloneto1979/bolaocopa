# Exemplos para Postman

## Autenticacao

### Registrar usuario
`POST /auth/register`

```json
{
  "name": "Paulo Sabatke Neto",
  "email": "pauloneto@cdsc.com.br",
  "password": "123456"
}
```

### Login
`POST /auth/login`

```json
{
  "email": "pauloneto@cdsc.com.br",
  "password": "123456"
}
```

Use o retorno `data.token` no header das chamadas protegidas:

```http
Authorization: Bearer SEU_TOKEN
```

### Usuario logado
`GET /auth/me`

### Trocar senha
`PUT /auth/password`

```json
{
  "password": "nova-senha"
}
```

## Boloes

### Criar bolao
`POST /pools`

```json
{
  "name": "Bolao Copa 2026",
  "entryValue": 50
}
```

O usuario autenticado vira `OWNER` automaticamente.

### Alterar bolao
`PUT /pools/:id`

```json
{
  "name": "Bolao Copa 2026",
  "entryValue": 75
}
```

Requer perfil `OWNER` no bolao.

## Membros

### Listar membros
`GET /pools/:poolId/members`

Requer `OWNER` ou `ADMIN`.

### Adicionar ou atualizar membro
`POST /pools/:poolId/members`

```json
{
  "userId": "uuid-do-usuario",
  "role": "ADMIN",
  "status": "ACTIVE",
  "entryValue": 50
}
```

Requer `OWNER`.

### Alterar perfil/status do membro
`PUT /pools/:poolId/members/:memberId`

```json
{
  "role": "USER",
  "status": "ACTIVE",
  "entryValue": 50
}
```

Requer `OWNER`.

## Apostas

### Criar aposta
`POST /bets`

```json
{
  "poolId": "uuid-do-bolao",
  "userId": "uuid-do-usuario",
  "gameId": "uuid-do-jogo",
  "homeScore": 2,
  "awayScore": 1
}
```

`USER` so pode apostar para si mesmo e precisa estar `ACTIVE`.

### Minhas apostas
`GET /bets/user/:userId?poolId=uuid-do-bolao`

## Resultados

### Lancar placar final
`PUT /games/:gameId/result?poolId=uuid-do-bolao`

```json
{
  "homeScore": 2,
  "awayScore": 0
}
```

Requer `OWNER` ou `ADMIN`.
