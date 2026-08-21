-- ================================================================
-- SeetuAds MVP — Schéma PostgreSQL pour Supabase
-- Exécuter dans l'éditeur SQL de Supabase (Dashboard → SQL Editor)
-- ================================================================

-- PROFILES (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'annonceur', 'commercant')),
  nom text NOT NULL,
  telephone text,
  created_at timestamptz DEFAULT now()
);

-- BOUTIQUES
CREATE TABLE IF NOT EXISTS public.boutiques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  adresse text,
  zone text,
  commercant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- ÉCRANS
CREATE TABLE IF NOT EXISTS public.ecrans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id uuid NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  serial text UNIQUE NOT NULL,
  statut text NOT NULL DEFAULT 'hors_ligne'
    CHECK (statut IN ('actif', 'hors_ligne', 'maintenance')),
  derniere_synchro timestamptz,
  created_at timestamptz DEFAULT now()
);

-- MÉDIAS
CREATE TABLE IF NOT EXISTS public.medias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonceur_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nom text NOT NULL,
  url text NOT NULL,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  duree_sec int NOT NULL DEFAULT 30,
  created_at timestamptz DEFAULT now()
);

-- CAMPAGNES
CREATE TABLE IF NOT EXISTS public.campagnes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonceur_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nom text NOT NULL,
  media_id uuid NOT NULL REFERENCES public.medias(id),
  statut text NOT NULL DEFAULT 'draft'
    CHECK (statut IN ('draft', 'en_attente', 'active', 'pause', 'terminee')),
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  frequence_par_heure int NOT NULL DEFAULT 3,
  budget_fcfa int,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT date_coherente CHECK (date_fin >= date_debut)
);

-- CAMPAGNES ↔ ÉCRANS
CREATE TABLE IF NOT EXISTS public.campagne_ecrans (
  campagne_id uuid NOT NULL REFERENCES public.campagnes(id) ON DELETE CASCADE,
  ecran_id uuid NOT NULL REFERENCES public.ecrans(id) ON DELETE CASCADE,
  PRIMARY KEY (campagne_id, ecran_id)
);

-- IMPRESSIONS
CREATE TABLE IF NOT EXISTS public.impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campagne_id uuid NOT NULL REFERENCES public.campagnes(id) ON DELETE CASCADE,
  ecran_id uuid NOT NULL REFERENCES public.ecrans(id) ON DELETE CASCADE,
  diffusee_a timestamptz DEFAULT now()
);

-- REVENUS
CREATE TABLE IF NOT EXISTS public.revenus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commercant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mois text NOT NULL, -- format: 'YYYY-MM'
  montant_fcfa int NOT NULL DEFAULT 0,
  statut text NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente', 'verse')),
  mode_paiement text,
  verse_le timestamptz,
  UNIQUE (commercant_id, mois)
);

-- ================================================================
-- INDEX
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_ecrans_boutique ON public.ecrans(boutique_id);
CREATE INDEX IF NOT EXISTS idx_ecrans_statut ON public.ecrans(statut);
CREATE INDEX IF NOT EXISTS idx_campagnes_annonceur ON public.campagnes(annonceur_id);
CREATE INDEX IF NOT EXISTS idx_campagnes_statut ON public.campagnes(statut);
CREATE INDEX IF NOT EXISTS idx_impressions_campagne ON public.impressions(campagne_id);
CREATE INDEX IF NOT EXISTS idx_impressions_ecran ON public.impressions(ecran_id);
CREATE INDEX IF NOT EXISTS idx_revenus_commercant ON public.revenus(commercant_id);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boutiques    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecrans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campagnes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campagne_ecrans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impressions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenus      ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES policies
CREATE POLICY "Profil visible par tous les authentifiés"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Modifier son propre profil"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admin voit tout"
  ON public.profiles FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin');

-- BOUTIQUES policies
CREATE POLICY "Admin voit toutes les boutiques"
  ON public.boutiques FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Commerçant voit ses boutiques"
  ON public.boutiques FOR SELECT TO authenticated
  USING (commercant_id = auth.uid());

CREATE POLICY "Annonceur voit les boutiques"
  ON public.boutiques FOR SELECT TO authenticated
  USING (public.get_user_role() = 'annonceur');

-- ÉCRANS policies
CREATE POLICY "Admin gère les écrans"
  ON public.ecrans FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Commerçant voit ses écrans"
  ON public.ecrans FOR SELECT TO authenticated
  USING (
    boutique_id IN (
      SELECT id FROM public.boutiques WHERE commercant_id = auth.uid()
    )
  );

CREATE POLICY "Annonceur voit les écrans actifs"
  ON public.ecrans FOR SELECT TO authenticated
  USING (public.get_user_role() = 'annonceur' AND statut = 'actif');

-- MÉDIAS policies
CREATE POLICY "Annonceur gère ses médias"
  ON public.medias FOR ALL TO authenticated
  USING (annonceur_id = auth.uid());

CREATE POLICY "Admin voit tous les médias"
  ON public.medias FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin');

-- CAMPAGNES policies
CREATE POLICY "Annonceur gère ses campagnes"
  ON public.campagnes FOR ALL TO authenticated
  USING (annonceur_id = auth.uid());

CREATE POLICY "Admin gère toutes les campagnes"
  ON public.campagnes FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin');

-- REVENUS policies
CREATE POLICY "Commerçant voit ses revenus"
  ON public.revenus FOR SELECT TO authenticated
  USING (commercant_id = auth.uid());

CREATE POLICY "Admin gère les revenus"
  ON public.revenus FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin');

-- ================================================================
-- TRIGGER: créer profil après inscription
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, nom)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'annonceur'),
    COALESCE(NEW.raw_user_meta_data->>'nom', 'Utilisateur')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- DONNÉES DE TEST (optionnel)
-- ================================================================
-- Insérer manuellement via Supabase Dashboard > Table Editor
-- ou utiliser les scripts de seed dans /scripts/seed.sql
