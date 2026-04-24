CREATE TABLE IF NOT EXISTS socios (
  id              SERIAL PRIMARY KEY,
  nome            VARCHAR(150) NOT NULL,
  cpf             VARCHAR(14) NOT NULL UNIQUE,
  email           VARCHAR(150),
  telefone        VARCHAR(20),
  data_nascimento DATE,
  plano_id        INTEGER NOT NULL REFERENCES planos(id),
  status          VARCHAR(20) NOT NULL DEFAULT 'ativo'
                    CHECK (status IN ('ativo', 'inativo', 'inadimplente')),
  data_cadastro   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
