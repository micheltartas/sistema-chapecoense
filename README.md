# ⚽ Sistema de Gestão — Chapecoense

Sistema de gestão de sócios desenvolvido com Node.js, Express e PostgreSQL.
Projeto didático para a disciplina de **Implantação de Sistemas** — SENAI.

---

## Estrutura do projeto

```
sistema-chapecoense/
│
├── backend/              ← servidor Node.js + API REST
│   ├── config/           ← conexão com o banco de dados
│   ├── middlewares/      ← autenticação JWT
│   ├── routes/           ← rotas da API (sócios, mensalidades, etc.)
│   └── server.js         ← entrada da aplicação
│
├── frontend/             ← interface do usuário
│   ├── css/              ← estilos (Bootstrap + tema Chapecoense)
│   ├── js/               ← lógica de cada página
│   └── index.html        ← página principal
│
├── database/             ← tudo relacionado ao banco de dados
│   ├── migrations/       ← scripts que criam as tabelas
│   ├── seeds/            ← dados iniciais (planos, usuários, exemplos)
│   └── scripts/          ← script de migração do CSV (Módulo V)
│
├── .env.example          ← modelo de configuração — copie para .env
├── .gitignore
├── package.json
└── README.md
```

---

## Pré-requisitos

| Software    | Versão mínima | Como verificar      |
|-------------|---------------|---------------------|
| Node.js     | 18 LTS        | `node --version`    |
| npm         | 9+            | `npm --version`     |
| PostgreSQL  | 14+           | `psql --version`    |
| Git         | qualquer      | `git --version`     |

---

## Instalação passo a passo

### 1. Clonar o repositório

```bash
git clone https://github.com/SEU_USUARIO/sistema-chapecoense.git
cd sistema-chapecoense
```

### 2. Instalar as dependências

```bash
npm install
```

Em produção, instale apenas o necessário:

```bash
npm install --omit=dev
```

### 3. Criar o banco de dados e o usuário

Conecte ao PostgreSQL como superusuário e execute:

```sql
CREATE USER app_chapecoense WITH PASSWORD 'defina_uma_senha_forte';
CREATE DATABASE chapecoense_dev OWNER app_chapecoense;
GRANT ALL PRIVILEGES ON DATABASE chapecoense_dev TO app_chapecoense;
```

Para **produção**, substitua `chapecoense_dev` por `chapecoense_prod`.

### 4. Configurar as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chapecoense_dev
DB_USER=app_chapecoense
DB_PASS=a_senha_definida_acima
NODE_ENV=development
PORT=3000
JWT_SECRET=gere_uma_chave_aleatoria_aqui
```

> 💡 Para gerar um JWT_SECRET seguro:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 5. Executar as migrations

```bash
npm run migrate
```

Saída esperada:
```
✅ 001_create_usuarios.sql — executada com sucesso
✅ 002_create_planos.sql   — executada com sucesso
✅ 003_create_socios.sql   — executada com sucesso
✅ 004_create_mensalidades.sql — executada com sucesso
```

### 6. Inserir dados iniciais

```bash
npm run seed
```

### 7. Iniciar o sistema

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

Acesse: **http://localhost:3000**

---

## Credenciais de acesso

| Perfil      | E-mail                       | Senha           |
|-------------|------------------------------|-----------------|
| Admin       | admin@chapecoense.com        | admin123        |
| Secretaria  | claudia@chapecoense.com      | secretaria123   |
| Financeiro  | rafael@chapecoense.com       | financeiro123   |

> ⚠️ Em produção, altere todas as senhas após a instalação.

---

## Checklist de validação

```bash
# Verificar se o servidor está respondendo
curl http://localhost:3000/health
```

- [ ] Servidor sobe sem erros
- [ ] `/health` retorna `{ "status": "ok" }`
- [ ] Login com admin funciona
- [ ] Dashboard exibe os cards de resumo
- [ ] Lista de sócios exibe os 5 exemplos
- [ ] Login com Cláudia (secretaria) não mostra menu de Usuários
- [ ] Login com Rafael (financeiro) mostra menu de Mensalidades

---

## Exercício de migração (Módulo V)

```bash
node database/scripts/migrar-socios-csv.js database/scripts/socios-planilha.csv
```

---

## Rotas da API

| Método | Rota                       | Perfil necessário              |
|--------|----------------------------|--------------------------------|
| POST   | /auth/login                | público                        |
| GET    | /auth/me                   | qualquer autenticado           |
| GET    | /dashboard                 | qualquer autenticado           |
| GET    | /planos                    | qualquer autenticado           |
| GET    | /socios                    | qualquer autenticado           |
| GET    | /socios/busca?q=           | qualquer autenticado           |
| GET    | /socios/:id                | qualquer autenticado           |
| POST   | /socios                    | admin, secretaria              |
| PUT    | /socios/:id                | admin, secretaria              |
| DELETE | /socios/:id                | admin                          |
| GET    | /mensalidades              | admin, financeiro              |
| GET    | /mensalidades/socio/:id    | admin, financeiro, secretaria  |
| POST   | /mensalidades              | admin, financeiro              |
| PUT    | /mensalidades/:id          | admin, financeiro              |
| GET    | /usuarios                  | admin                          |
| POST   | /usuarios                  | admin                          |
| PUT    | /usuarios/:id              | admin                          |
| DELETE | /usuarios/:id              | admin                          |

---

## Configuração para produção (pm2)

```bash
npm install -g pm2
pm2 start npm --name "chapecoense" -- start
pm2 startup
pm2 save
pm2 status
```
