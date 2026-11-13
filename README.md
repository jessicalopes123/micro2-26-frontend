# Catálogo de tecnologias

Aplicação web simples para cadastrar tecnologias e consultar nome, base e curva de aprendizado. A API REST usa MongoDB e exige um token Bearer em todas as rotas de tecnologias.

## Requisitos

- Node.js e npm
- Uma instância MongoDB (local ou Atlas)

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Na pasta raiz (a mesma do `package.json`), copie `.env.example` para `.env` e preencha `MONGODB_URI` com a conexão do seu MongoDB. Configure também `API_TOKEN` com um segredo longo e privado. No PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   O servidor carrega esse arquivo pelo caminho do projeto, mesmo se for iniciado a partir de outra pasta. Não compartilhe nem versione o arquivo `.env`.

3. Inicie o servidor:

   ```bash
   npm start
   ```

   Para desenvolvimento com reinicialização automática, use `npm run dev`.

4. Acesse <http://localhost:3003> e informe o mesmo token configurado em `API_TOKEN`.

## API

Todas as rotas abaixo exigem o cabeçalho:

```http
Authorization: Bearer seu-token
```

| Método | Rota | Ação |
| --- | --- | --- |
| GET | `/api/tecnologias` | Lista as tecnologias |
| POST | `/api/tecnologias` | Cadastra uma tecnologia |
| PUT | `/api/tecnologias/:id` | Atualiza uma tecnologia |
| DELETE | `/api/tecnologias/:id` | Exclui uma tecnologia |

O corpo de POST e PUT deve conter todos os campos:

```json
{
  "nome": "React",
  "base": "JS",
  "curvaAprendizado": "3 meses"
}
```

`base` aceita `PHP`, `C#` ou `JS`. A curva de aprendizado é um texto livre para informar o tempo médio, por exemplo, "3 meses" ou "8 semanas".
