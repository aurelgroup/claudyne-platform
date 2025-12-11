-- =====================================================
-- Migration: Système de Tickets de Paiement Manuel
-- Description: Table pour gérer les paiements en attente
--              de validation admin (transition avant API telcos)
-- Date: 2025-12-04
-- =====================================================

-- Créer la table payment_tickets
CREATE TABLE IF NOT EXISTS payment_tickets (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_reference VARCHAR(50) UNIQUE NOT NULL, -- Format: TKT-2025-XXXXX

  -- Relations
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,

  -- Informations de paiement
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
  plan_type VARCHAR(50) NOT NULL, -- FAMILY_MANAGER, INDIVIDUAL_STUDENT, etc.
  duration_days INTEGER NOT NULL DEFAULT 30, -- Durée d'extension en jours

  -- Détails de la transaction
  payment_method VARCHAR(50) NOT NULL, -- MTN_MOMO, ORANGE_MONEY, EXPRESS_UNION, BANK_TRANSFER
  phone_number VARCHAR(20),
  transaction_id VARCHAR(100), -- ID fourni par l'utilisateur

  -- Preuve de paiement
  proof_image_url TEXT, -- Chemin vers le fichier uploadé
  proof_image_size INTEGER, -- Taille en bytes
  proof_image_type VARCHAR(50), -- MIME type
  proof_uploaded_at TIMESTAMP,

  -- Statut et workflow
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, PROCESSING
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  processed_at TIMESTAMP, -- Quand l'extension a été appliquée
  auto_extended BOOLEAN DEFAULT FALSE, -- Si extension automatique (future API)
  rejection_reason TEXT,

  -- Notes et métadonnées
  user_notes TEXT, -- Notes de l'utilisateur lors de la soumission
  admin_notes TEXT, -- Notes internes de l'admin

  -- Sécurité et audit
  ip_address VARCHAR(50),
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT valid_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING')),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('MTN_MOMO', 'ORANGE_MONEY', 'EXPRESS_UNION', 'BANK_TRANSFER', 'CASH', 'OTHER')),
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT positive_duration CHECK (duration_days > 0)
);

-- =====================================================
-- Index pour performances (recommandé par ChatGPT)
-- =====================================================

-- Index sur family_id pour récupérer les tickets d'une famille
CREATE INDEX idx_payment_tickets_family_id ON payment_tickets(family_id);

-- Index sur user_id pour récupérer les tickets d'un utilisateur
CREATE INDEX idx_payment_tickets_user_id ON payment_tickets(user_id);

-- Index sur status pour filtrer les tickets en attente/approuvés
CREATE INDEX idx_payment_tickets_status ON payment_tickets(status);

-- Index sur created_at pour trier par date (DESC pour les plus récents)
CREATE INDEX idx_payment_tickets_created_at ON payment_tickets(created_at DESC);

-- Index composé pour les requêtes admin (tickets pending récents)
CREATE INDEX idx_payment_tickets_status_created ON payment_tickets(status, created_at DESC)
WHERE status = 'PENDING';

-- Index sur reviewed_by pour statistiques admin
CREATE INDEX idx_payment_tickets_reviewed_by ON payment_tickets(reviewed_by)
WHERE reviewed_by IS NOT NULL;

-- =====================================================
-- Fonction pour générer la référence ticket
-- =====================================================

CREATE OR REPLACE FUNCTION generate_ticket_reference()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  counter INTEGER;
  ref TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');

  -- Compter les tickets de l'année en cours
  SELECT COUNT(*) + 1 INTO counter
  FROM payment_tickets
  WHERE ticket_reference LIKE 'TKT-' || year || '-%';

  -- Générer la référence: TKT-2025-00001
  ref := 'TKT-' || year || '-' || LPAD(counter::TEXT, 5, '0');

  RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger pour auto-générer ticket_reference
-- =====================================================

CREATE OR REPLACE FUNCTION set_ticket_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_reference IS NULL OR NEW.ticket_reference = '' THEN
    NEW.ticket_reference := generate_ticket_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_ticket_reference
BEFORE INSERT ON payment_tickets
FOR EACH ROW
EXECUTE FUNCTION set_ticket_reference();

-- =====================================================
-- Trigger pour updated_at automatique
-- =====================================================

CREATE OR REPLACE FUNCTION update_payment_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_payment_ticket_timestamp
BEFORE UPDATE ON payment_tickets
FOR EACH ROW
EXECUTE FUNCTION update_payment_ticket_timestamp();

-- =====================================================
-- Vue pour statistiques admin
-- =====================================================

CREATE OR REPLACE VIEW payment_tickets_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
  COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_count,
  COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h_count,
  COUNT(*) FILTER (WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL '24 hours') as overdue_count,
  AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at))/3600) FILTER (WHERE reviewed_at IS NOT NULL) as avg_review_time_hours,
  SUM(amount) FILTER (WHERE status = 'APPROVED') as total_approved_amount
FROM payment_tickets;

-- =====================================================
-- Insertion de données de test (optionnel - à supprimer en prod)
-- =====================================================

-- Exemple de ticket (décommentez pour tester)
/*
INSERT INTO payment_tickets (
  user_id,
  family_id,
  amount,
  plan_type,
  duration_days,
  payment_method,
  phone_number,
  transaction_id,
  user_notes,
  ip_address
) VALUES (
  (SELECT id FROM users LIMIT 1),
  (SELECT id FROM families LIMIT 1),
  15000.00,
  'FAMILY_MANAGER',
  30,
  'MTN_MOMO',
  '+237695000000',
  'MTN123456789',
  'Premier paiement mensuel',
  '127.0.0.1'
);
*/

-- =====================================================
-- Permissions (à adapter selon vos rôles)
-- =====================================================

-- Les utilisateurs peuvent lire leurs propres tickets
-- GRANT SELECT ON payment_tickets TO authenticated_users;

-- Les admins peuvent tout faire
-- GRANT ALL ON payment_tickets TO admin_role;

-- =====================================================
-- Commentaires sur la table
-- =====================================================

COMMENT ON TABLE payment_tickets IS 'Tickets de paiement manuel en attente de validation admin (transition avant API telcos)';
COMMENT ON COLUMN payment_tickets.ticket_reference IS 'Référence unique du ticket (TKT-YYYY-XXXXX)';
COMMENT ON COLUMN payment_tickets.duration_days IS 'Nombre de jours d''extension à appliquer si approuvé';
COMMENT ON COLUMN payment_tickets.auto_extended IS 'TRUE si extension automatique via API telco (futur)';
COMMENT ON COLUMN payment_tickets.processed_at IS 'Date/heure d''application de l''extension (après approbation)';

-- =====================================================
-- Vérifications finales
-- =====================================================

-- Vérifier que la table existe
SELECT 'payment_tickets table created successfully!' as status
WHERE EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'payment_tickets'
);

-- Afficher les index créés
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'payment_tickets'
ORDER BY indexname;
