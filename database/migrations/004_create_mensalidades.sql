CREATE TABLE IF NOT EXISTS mensalidades (
  id              SERIAL PRIMARY KEY,
  socio_id        INTEGER NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
  plano_id        INTEGER NOT NULL REFERENCES planos(id),
  mes_referencia  VARCHAR(7) NOT NULL, -- formato: YYYY-MM
  valor           NUMERIC(10,2) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente', 'paga', 'atrasada')),
  data_pagamento  DATE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (socio_id, mes_referencia)
);
