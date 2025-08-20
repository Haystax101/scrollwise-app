-- Migration 008: Create Companies and Occupations Tables for Autocomplete
-- This migration creates the foundation for LinkedIn-style autocomplete with hybrid search
-- Includes normalized data model, search indexes, and foundational functions

BEGIN;

-- Enable required extensions for advanced search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
-- CREATE EXTENSION IF NOT EXISTS vector; -- Uncomment for future semantic search

-- Enhance existing companies table with normalized search capabilities
-- First check if columns already exist and add them if they don't
DO $$ 
BEGIN
  -- Add name_normalized column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'name_normalized') THEN
    ALTER TABLE companies ADD COLUMN name_normalized TEXT;
  END IF;
  
  -- Add country_code column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'country_code') THEN
    ALTER TABLE companies ADD COLUMN country_code TEXT DEFAULT 'GB';
  END IF;
  
  -- Add industry_sector column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'industry_sector') THEN
    ALTER TABLE companies ADD COLUMN industry_sector TEXT;
  END IF;
  
  -- Add company_number column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'company_number') THEN
    ALTER TABLE companies ADD COLUMN company_number TEXT;
  END IF;
  
  -- Add lei column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'lei') THEN
    ALTER TABLE companies ADD COLUMN lei TEXT;
  END IF;
  
  -- Add website_domain column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'website_domain') THEN
    ALTER TABLE companies ADD COLUMN website_domain TEXT;
  END IF;
  
  -- Add alt_names column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'alt_names') THEN
    ALTER TABLE companies ADD COLUMN alt_names TEXT[] DEFAULT '{}';
  END IF;
  
  -- Add employee_count_range column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'employee_count_range') THEN
    ALTER TABLE companies ADD COLUMN employee_count_range TEXT CHECK (employee_count_range IN ('1-10', '11-50', '51-200', '201-1000', '1001-5000', '5000+'));
  END IF;
  
  -- Add status column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'status') THEN
    ALTER TABLE companies ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dissolved', 'dormant'));
  END IF;
  
  -- Add popularity_score column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'popularity_score') THEN
    ALTER TABLE companies ADD COLUMN popularity_score INTEGER DEFAULT 0;
  END IF;
  
  -- Add search_vector column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'search_vector') THEN
    ALTER TABLE companies ADD COLUMN search_vector TSVECTOR;
  END IF;
  
  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'created_at') THEN
    ALTER TABLE companies ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add updated_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'updated_at') THEN
    ALTER TABLE companies ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Drop the UNIQUE constraint on name if it exists (we might have duplicates with different countries)
  BEGIN
    ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_name_key;
  EXCEPTION WHEN OTHERS THEN
    -- Constraint might not exist, ignore error
    NULL;
  END;
END $$;

-- Create occupations table with O*NET compatibility
CREATE TABLE IF NOT EXISTS occupations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_normalized TEXT, -- Lowercased, unaccented for fast matching
  onet_code TEXT UNIQUE, -- O*NET SOC code for stability
  esco_uri TEXT, -- EU ESCO URI for multilingual support
  category TEXT, -- High-level category (Engineering, Marketing, etc.)
  alt_titles TEXT[] DEFAULT '{}', -- Alternate/lay titles from O*NET
  required_skills TEXT[] DEFAULT '{}', -- Associated skill keywords
  salary_range_gbp TEXT, -- UK salary range for context
  popularity_score INTEGER DEFAULT 0, -- For ranking in autocomplete
  search_vector TSVECTOR, -- Stored computed search vector
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skills table for future skills autocomplete
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_normalized TEXT,
  category TEXT, -- Technical, Soft, Language, etc.
  popularity_score INTEGER DEFAULT 0,
  search_vector TSVECTOR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create company aliases table for additional names/synonyms
CREATE TABLE IF NOT EXISTS company_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  alias_type TEXT CHECK (alias_type IN ('trading_name', 'previous_name', 'abbreviation', 'colloquial')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, alias, alias_type)
);

-- Create occupation aliases table for additional titles
CREATE TABLE IF NOT EXISTS occupation_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_id UUID NOT NULL REFERENCES occupations(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  alias_type TEXT CHECK (alias_type IN ('lay_title', 'industry_specific', 'seniority_variant', 'abbreviation')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(occupation_id, alias, alias_type)
);

-- Function to normalize text (lowercase + remove accents)
CREATE OR REPLACE FUNCTION normalize_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE 
    WHEN input_text IS NULL THEN NULL
    ELSE lower(unaccent(trim(input_text)))
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update normalized fields and search vectors (for triggers)
CREATE OR REPLACE FUNCTION update_company_search_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Update normalized name
  NEW.name_normalized = normalize_text(NEW.name);
  
  -- Update search vector with weighted content
  NEW.search_vector = 
    setweight(to_tsvector('simple', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.alt_names, ' '), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.industry_sector, '')), 'C');
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_occupation_search_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Update normalized title
  NEW.title_normalized = normalize_text(NEW.title);
  
  -- Update search vector with weighted content
  NEW.search_vector = 
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.alt_titles, ' '), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.category, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.required_skills, ' '), '')), 'D');
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_skill_search_data()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name_normalized = normalize_text(NEW.name);
  NEW.search_vector = setweight(to_tsvector('simple', coalesce(NEW.name, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update search data
CREATE TRIGGER companies_search_update
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_company_search_data();

CREATE TRIGGER occupations_search_update
  BEFORE INSERT OR UPDATE ON occupations
  FOR EACH ROW EXECUTE FUNCTION update_occupation_search_data();

CREATE TRIGGER skills_search_update
  BEFORE INSERT OR UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_skill_search_data();

-- Create indexes for fast autocomplete performance
-- pg_trgm indexes for prefix and fuzzy matching (avoid array_to_string in indexes)
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON companies USING gin (name_normalized gin_trgm_ops);
-- Skip alt_names index for now since array_to_string is not immutable in index context

CREATE INDEX IF NOT EXISTS idx_occupations_title_trgm ON occupations USING gin (title_normalized gin_trgm_ops);
-- Skip alt_titles index for now since array_to_string is not immutable in index context

CREATE INDEX IF NOT EXISTS idx_skills_name_trgm ON skills USING gin (name_normalized gin_trgm_ops);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_companies_search_vector ON companies USING gin (search_vector);
CREATE INDEX IF NOT EXISTS idx_occupations_search_vector ON occupations USING gin (search_vector);
CREATE INDEX IF NOT EXISTS idx_skills_search_vector ON skills USING gin (search_vector);

-- Standard indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_status_popularity ON companies (status, popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies (country_code);
CREATE INDEX IF NOT EXISTS idx_companies_company_number ON companies (company_number) WHERE company_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_lei ON companies (lei) WHERE lei IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_occupations_category_popularity ON occupations (category, popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_occupations_onet ON occupations (onet_code) WHERE onet_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_company_aliases_company ON company_aliases (company_id);
CREATE INDEX IF NOT EXISTS idx_occupation_aliases_occupation ON occupation_aliases (occupation_id);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupation_aliases ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for authenticated users)
CREATE POLICY "Allow read access to companies" ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to occupations" ON occupations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to skills" ON skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to company aliases" ON company_aliases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to occupation aliases" ON occupation_aliases FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON companies TO authenticated;
GRANT SELECT ON occupations TO authenticated;
GRANT SELECT ON skills TO authenticated;
GRANT SELECT ON company_aliases TO authenticated;
GRANT SELECT ON occupation_aliases TO authenticated;

COMMIT;

-- Initial seed data for testing (small sample)
/*
INSERT INTO companies (name, country_code, industry_sector, popularity_score) VALUES
('Google', 'US', 'Technology', 100),
('Microsoft', 'US', 'Technology', 95),
('Apple', 'US', 'Technology', 90),
('Amazon', 'US', 'E-commerce/Cloud', 85),
('Meta', 'US', 'Social Media', 80),
('Tesla', 'US', 'Automotive/Energy', 75),
('Netflix', 'US', 'Entertainment', 70),
('Spotify', 'SE', 'Music/Audio', 65),
('Stripe', 'US', 'Financial Technology', 60),
('Airbnb', 'US', 'Travel/Hospitality', 55);

INSERT INTO occupations (title, category, popularity_score) VALUES
('Software Engineer', 'Engineering', 100),
('Product Manager', 'Product', 90),
('Data Scientist', 'Data & Analytics', 85),
('UX Designer', 'Design', 80),
('DevOps Engineer', 'Engineering', 75),
('Marketing Manager', 'Marketing', 70),
('Sales Manager', 'Sales', 65),
('Business Analyst', 'Business', 60),
('Project Manager', 'Operations', 55),
('Customer Success Manager', 'Customer Support', 50);
*/