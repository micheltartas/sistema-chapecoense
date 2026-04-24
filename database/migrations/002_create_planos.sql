CREATE TABLE IF NOT EXISTS planos (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  valor      NUMERIC(10,2) NOT NULL,
  descricao  TEXT,
  ativo      BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
