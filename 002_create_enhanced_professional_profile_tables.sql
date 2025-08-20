-- Migration 002: Create Enhanced Professional Profile Tables
-- This migration creates structured tables for professional profile data
-- Replaces unstructured profile_sections with proper relational data

BEGIN;

-- Create structured skills system (replacing profile_sections text blob for skills)
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_category TEXT DEFAULT 'technical' CHECK (skill_category IN ('technical', 'soft', 'language', 'certification', 'industry_specific')),
  proficiency_level TEXT DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience DECIMAL(3,1) CHECK (years_experience >= 0 AND years_experience <= 50),
  is_featured BOOLEAN DEFAULT FALSE, -- For highlighting top skills
  endorsement_count INTEGER DEFAULT 0 CHECK (endorsement_count >= 0),
  skill_description TEXT, -- Optional details about the skill
  acquired_date DATE, -- When skill was first acquired
  last_used_date DATE, -- When skill was last used professionally
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_name) -- One entry per skill per user
);

-- Create user skill endorsements (for future social features)
CREATE TABLE IF NOT EXISTS user_skill_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES user_skills(id) ON DELETE CASCADE,
  endorsed_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endorsement_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(skill_id, endorsed_by_user_id) -- One endorsement per skill per user
);

-- Create certifications table (separate from skills for proper tracking)
CREATE TABLE IF NOT EXISTS user_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  credential_id TEXT, -- Certificate ID/number
  credential_url TEXT, -- Link to verification
  issue_date DATE,
  expiration_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'expired', 'revoked')),
  certificate_file_url TEXT, -- Link to certificate file
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create languages table (separate from skills for proper tracking)
CREATE TABLE IF NOT EXISTS user_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  language_name TEXT NOT NULL,
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('elementary', 'limited_working', 'professional', 'full_professional', 'native')),
  is_native BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  certification_name TEXT, -- e.g., "TOEFL", "IELTS"
  certification_score TEXT, -- e.g., "110/120", "8.5/9.0"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, language_name)
);

-- Create publications/portfolio table for showcasing work
CREATE TABLE IF NOT EXISTS user_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  publication_type TEXT CHECK (publication_type IN ('article', 'research_paper', 'book', 'blog_post', 'whitepaper', 'case_study')),
  publication_url TEXT,
  published_date DATE,
  publisher TEXT,
  co_authors TEXT[], -- Array of co-author names
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_featured ON user_skills(user_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_user_skills_category ON user_skills(user_id, skill_category);
CREATE INDEX idx_user_skills_proficiency ON user_skills(user_id, proficiency_level);

CREATE INDEX idx_skill_endorsements_skill ON user_skill_endorsements(skill_id);
CREATE INDEX idx_skill_endorsements_endorser ON user_skill_endorsements(endorsed_by_user_id);

CREATE INDEX idx_user_certifications_user ON user_certifications(user_id);
CREATE INDEX idx_user_certifications_active ON user_certifications(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_certifications_expiry ON user_certifications(expiration_date) WHERE expiration_date IS NOT NULL;

CREATE INDEX idx_user_languages_user ON user_languages(user_id);
CREATE INDEX idx_user_languages_featured ON user_languages(user_id, is_featured) WHERE is_featured = true;

CREATE INDEX idx_user_publications_user ON user_publications(user_id);
CREATE INDEX idx_user_publications_featured ON user_publications(user_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_user_publications_type ON user_publications(user_id, publication_type);

-- Add RLS policies for security
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_publications ENABLE ROW LEVEL SECURITY;

-- Skills policies
CREATE POLICY "Users can view their own skills" ON user_skills
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own skills" ON user_skills
  FOR ALL USING (auth.uid() = user_id);

-- Public view policy for skills (for profile viewing by others)
CREATE POLICY "Public can view skills" ON user_skills
  FOR SELECT USING (true); -- Skills are generally public profile data

-- Endorsements policies
CREATE POLICY "Users can view endorsements" ON user_skill_endorsements
  FOR SELECT USING (true); -- Endorsements are public

CREATE POLICY "Users can endorse others' skills" ON user_skill_endorsements
  FOR INSERT WITH CHECK (auth.uid() = endorsed_by_user_id);

CREATE POLICY "Users can manage their own endorsements" ON user_skill_endorsements
  FOR DELETE USING (auth.uid() = endorsed_by_user_id);

-- Certifications policies
CREATE POLICY "Users can view their own certifications" ON user_certifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own certifications" ON user_certifications
  FOR ALL USING (auth.uid() = user_id);

-- Languages policies
CREATE POLICY "Public can view languages" ON user_languages
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own languages" ON user_languages
  FOR ALL USING (auth.uid() = user_id);

-- Publications policies
CREATE POLICY "Public can view publications" ON user_publications
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own publications" ON user_publications
  FOR ALL USING (auth.uid() = user_id);

-- Function to migrate existing skills from profile_sections
CREATE OR REPLACE FUNCTION migrate_skills_from_profile_sections()
RETURNS INTEGER AS $$
DECLARE
  section_record RECORD;
  skill TEXT;
  migrated_count INTEGER := 0;
BEGIN
  -- Loop through all users' skills in profile_sections
  FOR section_record IN 
    SELECT user_id, content 
    FROM profile_sections 
    WHERE section_type = 'skills' AND content IS NOT NULL AND content != ''
  LOOP
    -- Split comma-separated skills and insert into user_skills table
    FOR skill IN 
      SELECT TRIM(unnest(string_to_array(section_record.content, ',')))
    LOOP
      IF skill != '' THEN
        INSERT INTO user_skills (user_id, skill_name, skill_category, proficiency_level)
        VALUES (section_record.user_id, skill, 'technical', 'intermediate')
        ON CONFLICT (user_id, skill_name) DO NOTHING;
        
        migrated_count := migrated_count + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's top skills (for profile display)
CREATE OR REPLACE FUNCTION get_user_top_skills(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  skill_name TEXT,
  skill_category TEXT,
  proficiency_level TEXT,
  years_experience DECIMAL,
  endorsement_count INTEGER,
  is_featured BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.skill_name,
    us.skill_category,
    us.proficiency_level,
    us.years_experience,
    us.endorsement_count,
    us.is_featured
  FROM user_skills us
  WHERE us.user_id = p_user_id
  ORDER BY 
    us.is_featured DESC,
    us.endorsement_count DESC,
    us.proficiency_level DESC,
    us.years_experience DESC NULLS LAST,
    us.skill_name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update skill endorsement count
CREATE OR REPLACE FUNCTION update_skill_endorsement_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_skills 
    SET endorsement_count = endorsement_count + 1,
        updated_at = NOW()
    WHERE id = NEW.skill_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_skills 
    SET endorsement_count = GREATEST(0, endorsement_count - 1),
        updated_at = NOW()
    WHERE id = OLD.skill_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain endorsement counts
CREATE TRIGGER trigger_update_skill_endorsement_count
  AFTER INSERT OR DELETE ON user_skill_endorsements
  FOR EACH ROW
  EXECUTE FUNCTION update_skill_endorsement_count();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_skills TO authenticated;
GRANT SELECT, INSERT, DELETE ON user_skill_endorsements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_certifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_languages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_publications TO authenticated;

COMMIT;

-- Usage Examples (for reference):
/*

-- Migrate existing skills from profile_sections
SELECT migrate_skills_from_profile_sections();

-- Add a new skill
INSERT INTO user_skills (user_id, skill_name, skill_category, proficiency_level, years_experience, is_featured)
VALUES ('user-uuid', 'React.js', 'technical', 'advanced', 3.5, true);

-- Add a certification
INSERT INTO user_certifications (user_id, certification_name, issuing_organization, issue_date, expiration_date)
VALUES ('user-uuid', 'AWS Solutions Architect', 'Amazon Web Services', '2023-01-15', '2026-01-15');

-- Add a language
INSERT INTO user_languages (user_id, language_name, proficiency_level, is_native)
VALUES ('user-uuid', 'Spanish', 'professional', false);

-- Get user's top skills
SELECT * FROM get_user_top_skills('user-uuid', 5);

-- Endorse a skill
INSERT INTO user_skill_endorsements (skill_id, endorsed_by_user_id, endorsement_text)
VALUES ('skill-uuid', 'endorser-uuid', 'Great React developer!');

*/