-- Menu items & admin login codes
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_de TEXT NOT NULL,
  description_en TEXT,
  description_de TEXT,
  ingredients_en TEXT[] NOT NULL DEFAULT '{}',
  ingredients_de TEXT[] NOT NULL DEFAULT '{}',
  spicy_level SMALLINT NOT NULL DEFAULT 0 CHECK (spicy_level BETWEEN 0 AND 5),
  price_cents INT NOT NULL CHECK (price_cents >= 0),
  images TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS menu_items_active_idx ON menu_items(active) WHERE active;

CREATE TABLE IF NOT EXISTS admin_login_codes (
  id SERIAL PRIMARY KEY,
  code_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  CONSTRAINT admin_login_codes_not_expired CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS admin_login_codes_active_idx ON admin_login_codes(expires_at) WHERE used_at IS NULL;
