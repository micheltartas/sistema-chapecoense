CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(150) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  senha_hash  VARCHAR(255) NOT NULL,
  perfil      VARCHAR(20) NOT NULL CHECK (perfil IN ('admin', 'secretaria', 'financeiro')),
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
