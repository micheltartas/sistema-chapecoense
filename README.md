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
│   ├── routes/           ← rotas da API
│   └── server.js         ← entrada da aplicação
│
├── frontend/             ← interface do usuário
│   ├── css/              ← estilos (Bootstrap + tema Chapecoense)
│   ├── js/               ← lógica de cada página
│   └── index.html        ← página principal
│
├── database/             ← tudo relacionado ao banco de dados
│   ├── migrations/       ← scripts que criam as tabelas
│   ├── seeds/            ← dados iniciais
│   └── scripts/          ← script de migração CSV (Módulo V)
│
├── .env.example          ← modelo de configuração
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
| PostgreSQL  | 14+           | pgAdmin 4 abre sem erro |
| pgAdmin     | 4             | interface gráfica   |
| Git         | qualquer      | `git --version`     |

---

## Instalação

> 💡 **Alunos do SENAI:** siga o **Guia de Instalação** disponível na base de conhecimento do Notion — ele cobre cada etapa com mais detalhes, incluindo o passo a passo no pgAdmin 4.

Para referência técnica, os passos resumidos são:

### 1. Clonar o repositório

```bash
git clone https://github.com/micheltartas/sistema-chapecoense.git
cd sistema-chapecoense
```

### 2. Criar banco e usuário

No pgAdmin 4, conectado como `postgres`:
- Crie a **Login/Group Role** `app_chapecoense` com senha forte — sem nenhum privilege administrativo, apenas **Can login**
- Crie o **Database** `chapecoense_dev` com owner `app_chapecoense`
- No **Query Tool** do banco, execute:

```sql
GRANT USAGE ON SCHEMA public TO app_chapecoense;
GRANT CREATE ON SCHEMA public TO app_chapecoense;
```

### 3. Configurar as variáveis de ambiente

```bash
copy .env.example .env
```

Edite o `.env`:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chapecoense_dev
DB_USER=app_chapecoense
DB_PASS=sua_senha_aqui
NODE_ENV=development
PORT=3000
JWT_SECRET=gere_uma_chave_longa_aqui
```

> 💡 Para gerar um JWT_SECRET seguro:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Instalar dependências

```bash
npm install
```

Em produção:
```bash
npm install --omit=dev
```

### 5. Executar migrations

```bash
npm run migrate
```

### 6. Conceder permissões nas tabelas

No **Query Tool** do pgAdmin, conectado como `postgres`:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_chapecoense;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_chapecoense;
```

### 7. Inserir dados iniciais

```bash
npm run seed
```

### 8. Iniciar o sistema

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
curl http://localhost:3000/health
```

- [ ] Servidor sobe sem erros
- [ ] `/health` retorna `{ "status": "ok" }`
- [ ] Login com admin funciona
- [ ] Dashboard exibe os cards de resumo
- [ ] Lista de sócios exibe 5 registros
- [ ] Login com Cláudia não mostra menu de Usuários
- [ ] Login com Rafael mostra menu de Mensalidades
- [ ] Tabelas visíveis no pgAdmin

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