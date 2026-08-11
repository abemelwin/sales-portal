-- Migration: Create quote sub-tables
-- Description: Term options, trade-ins, and consumable price overrides for quotes
-- Requirements: 5.7, 5.5

CREATE TABLE quote_term_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    down_payment NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (down_payment >= 0),
    months INT NOT NULL CHECK (months BETWEEN 1 AND 60),
    monthly_amortization NUMERIC(12,2),
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE quote_trade_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    value NUMERIC(12,2) NOT NULL CHECK (value >= 0),
    sort_order INT NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN 0 AND 2)
);

CREATE TABLE quote_consumable_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    consumable_id UUID NOT NULL REFERENCES machine_consumables(id),
    custom_price NUMERIC(12,2) NOT NULL CHECK (custom_price >= 0)
);
