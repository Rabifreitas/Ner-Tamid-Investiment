-- =====================================================
-- NER TAMID ETERNAL INSIGHTS - DATABASE SCHEMA
-- "A Luz Eterna que guia investimentos com propósito"
-- =====================================================
-- #NerTamidEternal

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Charity preferences
    charity_percentage DECIMAL(5,2) DEFAULT 20.00 CHECK (charity_percentage >= 20.00),
    preferred_charity_category VARCHAR(100),
    
    -- Account status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- =====================================================
-- CHARITY ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE charity_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    
    -- Verification
    registration_number VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Blockchain integration
    wallet_address VARCHAR(255),
    
    -- Contact info
    website VARCHAR(255),
    email VARCHAR(255),
    country VARCHAR(100),
    
    -- Impact metrics
    total_received DECIMAL(19,4) DEFAULT 0,
    beneficiaries_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for category filtering
CREATE INDEX idx_charity_orgs_category ON charity_organizations(category);
CREATE INDEX idx_charity_orgs_verified ON charity_organizations(is_verified) WHERE is_verified = TRUE;

-- =====================================================
-- INVESTMENTS TABLE
-- =====================================================
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Asset information
    symbol VARCHAR(20) NOT NULL,
    asset_name VARCHAR(255),
    asset_type VARCHAR(50) NOT NULL, -- stock, etf, crypto, bond, etc.
    
    -- Position data
    quantity DECIMAL(19,8) NOT NULL DEFAULT 0,
    average_cost DECIMAL(19,4) NOT NULL DEFAULT 0,
    current_price DECIMAL(19,4),
    
    -- Profit tracking
    unrealized_profit DECIMAL(19,4) DEFAULT 0,
    realized_profit DECIMAL(19,4) DEFAULT 0,
    total_charity_allocated DECIMAL(19,4) DEFAULT 0,
    
    -- Timestamps
    first_purchase_at TIMESTAMP WITH TIME ZONE,
    last_transaction_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_investments_user ON investments(user_id);
CREATE INDEX idx_investments_symbol ON investments(symbol);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_type VARCHAR(20) NOT NULL, -- buy, sell, dividend
    quantity DECIMAL(19,8) NOT NULL,
    price_per_unit DECIMAL(19,4) NOT NULL,
    total_amount DECIMAL(19,4) NOT NULL,
    fees DECIMAL(19,4) DEFAULT 0,
    
    -- Profit/Loss (for sells)
    profit_loss DECIMAL(19,4),
    is_profit_realized BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'completed',
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_transactions_investment ON transactions(investment_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_profit_realized ON transactions(is_profit_realized) WHERE is_profit_realized = TRUE;

-- =====================================================
-- CHARITY TRANSACTIONS TABLE (CORE - 20% ALLOCATION)
-- =====================================================
CREATE TABLE charity_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    charity_organization_id UUID REFERENCES charity_organizations(id),
    
    -- Amount details
    profit_amount DECIMAL(19,4) NOT NULL,
    charity_percentage DECIMAL(5,2) NOT NULL CHECK (charity_percentage >= 20.00),
    charity_amount DECIMAL(19,4) NOT NULL,
    
    -- Charity selection
    selected_by VARCHAR(50) DEFAULT 'automatic', -- automatic, user_choice, community_vote
    impact_category VARCHAR(100),
    
    -- Blockchain transparency
    blockchain_network VARCHAR(50),
    blockchain_tx_hash VARCHAR(255),
    blockchain_confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status flow: pending -> allocated -> transferred -> confirmed
    status VARCHAR(50) DEFAULT 'pending',
    
    -- Impact tracking
    impact_description TEXT,
    impact_metrics JSONB,
    
    -- Timestamps
    allocated_at TIMESTAMP WITH TIME ZONE,
    transferred_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for charity reporting
CREATE INDEX idx_charity_tx_user ON charity_transactions(user_id);
CREATE INDEX idx_charity_tx_org ON charity_transactions(charity_organization_id);
CREATE INDEX idx_charity_tx_status ON charity_transactions(status);
CREATE INDEX idx_charity_tx_created ON charity_transactions(created_at);

-- =====================================================
-- EXCHANGE CONNECTIVITY
-- =====================================================

-- User Exchange API Keys (Encrypted)
CREATE TABLE IF NOT EXISTS user_exchange_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exchange_id VARCHAR(50) NOT NULL, -- e.g., 'binance', 'alpaca', 'kraken'
    api_key TEXT NOT NULL,          -- Encrypted
    api_secret TEXT NOT NULL,       -- Encrypted
    passphrase TEXT,                -- Encrypted (optional for some exchanges)
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, exchange_id)
);

CREATE INDEX idx_user_exchange_keys_user ON user_exchange_keys(user_id);

-- Audit log for key changes
CREATE TRIGGER audit_user_exchange_keys_changes
AFTER INSERT OR UPDATE OR DELETE ON user_exchange_keys
FOR EACH ROW EXECUTE FUNCTION log_audit_change();

-- =====================================================
-- CHARITY IMPACT REPORTS TABLE
-- =====================================================
CREATE TABLE charity_impact_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    charity_organization_id UUID NOT NULL REFERENCES charity_organizations(id),
    
    -- Report period
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    
    -- Financials
    total_received DECIMAL(19,4) NOT NULL,
    total_distributed DECIMAL(19,4) NOT NULL,
    
    -- Impact metrics
    beneficiaries_helped INTEGER,
    projects_funded INTEGER,
    impact_summary TEXT,
    detailed_metrics JSONB,
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(255),
    verification_document_url VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- USER SESSIONS TABLE
-- =====================================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- =====================================================
-- AUDIT LOG TABLE (For transparency)
-- =====================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- =====================================================
-- LIMIT ORDERS
-- =====================================================
CREATE TABLE IF NOT EXISTS limit_orders (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    investment_id UUID REFERENCES investments(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    order_type VARCHAR(10) NOT NULL, -- 'buy' or 'sell'
    target_price DECIMAL(20, 8) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'executed', 'cancelled', 'failed'
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_limit_orders_user ON limit_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_limit_orders_status ON limit_orders(status);

-- AUDIT TRIGGER FOR LIMIT ORDERS
CREATE TRIGGER audit_limit_orders_update
    BEFORE UPDATE ON limit_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

/* 
-- DEPRECATED: The charity allocation is now handled by the TypeScript CharityEngine
-- to allow for more complex logic (charity selection, blockchain logging).
-- The trigger is disabled to avoid double allocations.

CREATE OR REPLACE FUNCTION allocate_charity_on_profit()
RETURNS TRIGGER AS $$
DECLARE
    user_charity_pct DECIMAL(5,2);
    charity_amount DECIMAL(19,4);
BEGIN
    -- Only trigger on profit realization
    IF NEW.profit_loss > 0 AND NEW.is_profit_realized = TRUE THEN
        -- Get user's charity percentage (minimum 20%)
        SELECT GREATEST(charity_percentage, 20.00)
        INTO user_charity_pct
        FROM users
        WHERE id = NEW.user_id;
        
        -- Calculate charity amount
        charity_amount := NEW.profit_loss * (user_charity_pct / 100);
        
        -- Create charity transaction
        INSERT INTO charity_transactions (
            transaction_id,
            user_id,
            profit_amount,
            charity_percentage,
            charity_amount,
            status,
            allocated_at
        ) VALUES (
            NEW.id,
            NEW.user_id,
            NEW.profit_loss,
            user_charity_pct,
            charity_amount,
            'allocated',
            CURRENT_TIMESTAMP
        );
        
        -- Update investment's total charity allocated
        UPDATE investments
        SET total_charity_allocated = total_charity_allocated + charity_amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.investment_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to transactions table
CREATE TRIGGER trigger_charity_allocation
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION allocate_charity_on_profit();
*/

-- =====================================================
-- SEED DATA: Default Charity Organizations
-- =====================================================
INSERT INTO charity_organizations (name, description, category, is_verified, country) VALUES
('Médicos Sem Fronteiras', 'Assistência médica humanitária internacional', 'health', TRUE, 'International'),
('UNICEF', 'Proteção dos direitos das crianças', 'children', TRUE, 'International'),
('Cruz Vermelha', 'Assistência humanitária em emergências', 'humanitarian', TRUE, 'International'),
('WWF', 'Conservação da natureza e redução de ameaças ambientais', 'environment', TRUE, 'International'),
('Banco Alimentar', 'Combate ao desperdício alimentar e à fome', 'food', TRUE, 'Portugal'),
('AMI', 'Luta contra a pobreza e exclusão social', 'social', TRUE, 'Portugal'),
('Raríssimas', 'Apoio a portadores de doenças raras', 'health', TRUE, 'Portugal'),
('Make-A-Wish', 'Realização de desejos de crianças com doenças graves', 'children', TRUE, 'International');

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- User charity impact summary
CREATE VIEW user_charity_summary AS
SELECT 
    u.id AS user_id,
    u.full_name,
    COUNT(ct.id) AS total_donations,
    COALESCE(SUM(ct.charity_amount), 0) AS total_donated,
    COALESCE(AVG(ct.charity_percentage), 20) AS avg_charity_percentage,
    MAX(ct.created_at) AS last_donation_at
FROM users u
LEFT JOIN charity_transactions ct ON u.id = ct.user_id
GROUP BY u.id, u.full_name;

-- Platform-wide charity metrics
CREATE VIEW platform_charity_metrics AS
SELECT 
    COUNT(DISTINCT user_id) AS donors_count,
    COUNT(*) AS total_transactions,
    COALESCE(SUM(charity_amount), 0) AS total_donated,
    COALESCE(SUM(profit_amount), 0) AS total_profits_processed,
    DATE_TRUNC('month', created_at) AS month
FROM charity_transactions
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE charity_transactions IS 'Core table for the 20% automatic charity allocation - the ethical heart of Ner Tamid';
COMMENT ON COLUMN charity_transactions.charity_percentage IS 'Never less than 20% - this is a platform-enforced ethical minimum';
-- COMMENT ON FUNCTION allocate_charity_on_profit() IS 'Automatically allocates charity when profit is realized - triggered on every profitable transaction';
