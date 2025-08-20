-- Migration 010: Seed Companies and Occupations Data
-- This migration provides initial high-quality seed data for autocomplete
-- Includes major UK/global companies and O*NET-inspired occupations

BEGIN;

-- Insert major UK and global companies
INSERT INTO companies (name, country_code, industry_sector, employee_count_range, popularity_score, alt_names) VALUES
-- UK Technology
('Google', 'GB', 'Technology', '5000+', 100, ARRAY['Google UK', 'Alphabet Inc']),
('Microsoft', 'GB', 'Technology', '5000+', 95, ARRAY['Microsoft UK', 'MSFT']),
('Amazon', 'GB', 'E-commerce/Cloud', '5000+', 90, ARRAY['Amazon UK', 'AWS']),
('Meta', 'GB', 'Social Media', '1001-5000', 85, ARRAY['Facebook', 'Meta Platforms']),
('Apple', 'GB', 'Technology', '1001-5000', 80, ARRAY['Apple UK']),

-- UK Financial Services  
('Barclays', 'GB', 'Financial Services', '5000+', 75, ARRAY['Barclays Bank', 'Barclays PLC']),
('HSBC', 'GB', 'Financial Services', '5000+', 70, ARRAY['HSBC Holdings', 'Hong Kong and Shanghai Banking Corporation']),
('Lloyds Banking Group', 'GB', 'Financial Services', '5000+', 65, ARRAY['Lloyds Bank', 'LBG']),
('NatWest Group', 'GB', 'Financial Services', '5000+', 60, ARRAY['NatWest', 'Royal Bank of Scotland', 'RBS']),
('Standard Chartered', 'GB', 'Financial Services', '5000+', 55, ARRAY['StanChart']),

-- UK Retail & Consumer
('Tesco', 'GB', 'Retail', '5000+', 65, ARRAY['Tesco PLC']),
('Sainsbury''s', 'GB', 'Retail', '5000+', 60, ARRAY['J Sainsbury', 'Sainsburys']),
('ASDA', 'GB', 'Retail', '5000+', 55, ARRAY['ASDA Stores']),
('Marks & Spencer', 'GB', 'Retail', '5000+', 50, ARRAY['M&S', 'Marks and Spencer']),
('John Lewis Partnership', 'GB', 'Retail', '5000+', 45, ARRAY['John Lewis', 'Waitrose']),

-- UK Energy & Utilities
('BP', 'GB', 'Energy', '5000+', 70, ARRAY['British Petroleum', 'BP PLC']),
('Shell', 'GB', 'Energy', '5000+', 65, ARRAY['Royal Dutch Shell']),
('British Gas', 'GB', 'Utilities', '5000+', 50, ARRAY['Centrica']),
('National Grid', 'GB', 'Utilities', '5000+', 45, ARRAY['National Grid PLC']),

-- UK Telecommunications
('BT Group', 'GB', 'Telecommunications', '5000+', 60, ARRAY['British Telecom', 'BT']),
('Vodafone', 'GB', 'Telecommunications', '5000+', 55, ARRAY['Vodafone Group']),
('EE', 'GB', 'Telecommunications', '5000+', 45, ARRAY['Everything Everywhere']),
('O2', 'GB', 'Telecommunications', '5000+', 40, ARRAY['Telefonica UK']),

-- UK Aerospace & Defence
('BAE Systems', 'GB', 'Aerospace & Defence', '5000+', 50, ARRAY['BAE']),
('Rolls-Royce', 'GB', 'Aerospace & Defence', '5000+', 45, ARRAY['Rolls Royce Holdings']),
('Airbus', 'GB', 'Aerospace & Defence', '5000+', 40, ARRAY['Airbus Group']),

-- UK Pharmaceuticals
('GSK', 'GB', 'Pharmaceuticals', '5000+', 60, ARRAY['GlaxoSmithKline']),
('AstraZeneca', 'GB', 'Pharmaceuticals', '5000+', 55, ARRAY['AZ']),

-- UK Consulting & Professional Services
('Deloitte', 'GB', 'Professional Services', '5000+', 70, ARRAY['Deloitte UK']),
('PwC', 'GB', 'Professional Services', '5000+', 65, ARRAY['PricewaterhouseCoopers']),
('KPMG', 'GB', 'Professional Services', '5000+', 60, ARRAY['KPMG UK']),
('EY', 'GB', 'Professional Services', '5000+', 55, ARRAY['Ernst & Young']),
('McKinsey & Company', 'GB', 'Management Consulting', '1001-5000', 50, ARRAY['McKinsey']),
('Boston Consulting Group', 'GB', 'Management Consulting', '1001-5000', 45, ARRAY['BCG']),
('Bain & Company', 'GB', 'Management Consulting', '1001-5000', 40, ARRAY['Bain']),

-- UK Startups & Scale-ups
('Monzo', 'GB', 'Financial Technology', '201-1000', 60, ARRAY['Monzo Bank']),
('Revolut', 'GB', 'Financial Technology', '1001-5000', 55, ARRAY[]),
('Deliveroo', 'GB', 'Food Delivery', '1001-5000', 50, ARRAY[]),
('Wise', 'GB', 'Financial Technology', '1001-5000', 45, ARRAY['TransferWise']),
('Zopa', 'GB', 'Financial Technology', '201-1000', 35, ARRAY['Zopa Bank']),

-- Global Tech (US HQ but significant UK presence)
('Netflix', 'US', 'Entertainment', '5000+', 70, ARRAY['Netflix Inc']),
('Spotify', 'SE', 'Music/Audio', '1001-5000', 65, ARRAY[]),
('Stripe', 'US', 'Financial Technology', '1001-5000', 60, ARRAY[]),
('Airbnb', 'US', 'Travel/Hospitality', '1001-5000', 55, ARRAY[]),
('Uber', 'US', 'Transportation', '5000+', 50, ARRAY['Uber Technologies']),

-- Investment Banking
('Goldman Sachs', 'US', 'Investment Banking', '5000+', 65, ARRAY['Goldman Sachs Group']),
('Morgan Stanley', 'US', 'Investment Banking', '5000+', 60, ARRAY[]),
('JPMorgan Chase', 'US', 'Investment Banking', '5000+', 55, ARRAY['JPMorgan', 'Chase']),
('Deutsche Bank', 'DE', 'Investment Banking', '5000+', 50, ARRAY['DB']);

-- Insert occupation titles based on O*NET structure with UK context
INSERT INTO occupations (title, category, salary_range_gbp, popularity_score, alt_titles, required_skills) VALUES
-- Engineering & Technology
('Software Engineer', 'Engineering', '£40k-£80k', 100, 
 ARRAY['Software Developer', 'Programmer', 'Software Dev', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer'], 
 ARRAY['Programming', 'Problem Solving', 'Git', 'Agile']),
 
('Senior Software Engineer', 'Engineering', '£60k-£120k', 95,
 ARRAY['Senior Software Developer', 'Senior Programmer', 'Lead Developer'],
 ARRAY['Programming', 'Mentoring', 'Architecture', 'Code Review']),
 
('Principal Software Engineer', 'Engineering', '£80k-£150k', 80,
 ARRAY['Principal Developer', 'Staff Engineer', 'Technical Lead'],
 ARRAY['Technical Leadership', 'System Design', 'Mentoring']),

('Data Scientist', 'Data & Analytics', '£45k-£90k', 90,
 ARRAY['Data Analyst', 'ML Engineer', 'Machine Learning Engineer'],
 ARRAY['Python', 'SQL', 'Statistics', 'Machine Learning']),

('DevOps Engineer', 'Engineering', '£45k-£85k', 85,
 ARRAY['Site Reliability Engineer', 'SRE', 'Platform Engineer', 'Cloud Engineer'],
 ARRAY['AWS', 'Docker', 'Kubernetes', 'CI/CD']),

('Frontend Developer', 'Engineering', '£35k-£70k', 75,
 ARRAY['UI Developer', 'Web Developer', 'React Developer', 'Angular Developer'],
 ARRAY['JavaScript', 'React', 'CSS', 'HTML']),

('Backend Developer', 'Engineering', '£40k-£75k', 75,
 ARRAY['Server Developer', 'API Developer', 'Database Developer'],
 ARRAY['Node.js', 'Python', 'Java', 'Database Design']),

('Mobile Developer', 'Engineering', '£40k-£80k', 70,
 ARRAY['iOS Developer', 'Android Developer', 'App Developer', 'React Native Developer'],
 ARRAY['Swift', 'Kotlin', 'React Native', 'Mobile UI']),

-- Product Management
('Product Manager', 'Product', '£50k-£100k', 95,
 ARRAY['PM', 'Product Owner', 'Associate Product Manager'],
 ARRAY['Product Strategy', 'User Research', 'Analytics', 'Roadmapping']),

('Senior Product Manager', 'Product', '£70k-£130k', 85,
 ARRAY['Senior PM', 'Lead Product Manager'],
 ARRAY['Product Strategy', 'Team Leadership', 'Stakeholder Management']),

('Principal Product Manager', 'Product', '£90k-£160k', 70,
 ARRAY['Staff Product Manager', 'Director of Product'],
 ARRAY['Product Vision', 'Strategic Planning', 'Cross-functional Leadership']),

-- Design
('UX Designer', 'Design', '£35k-£70k', 80,
 ARRAY['User Experience Designer', 'Interaction Designer', 'UX/UI Designer'],
 ARRAY['User Research', 'Prototyping', 'Figma', 'Design Thinking']),

('UI Designer', 'Design', '£30k-£65k', 75,
 ARRAY['User Interface Designer', 'Visual Designer', 'Digital Designer'],
 ARRAY['Visual Design', 'Figma', 'Adobe Creative Suite', 'Prototyping']),

('Product Designer', 'Design', '£40k-£80k', 85,
 ARRAY['Senior UX Designer', 'Lead Designer', 'Design Lead'],
 ARRAY['User Research', 'Product Strategy', 'Design Systems', 'Prototyping']),

-- Marketing & Sales
('Marketing Manager', 'Marketing', '£30k-£60k', 70,
 ARRAY['Digital Marketing Manager', 'Brand Manager', 'Marketing Lead'],
 ARRAY['Digital Marketing', 'Brand Strategy', 'Analytics', 'Campaign Management']),

('Sales Manager', 'Sales', '£35k-£70k', 65,
 ARRAY['Account Manager', 'Business Development Manager', 'Sales Lead'],
 ARRAY['Sales Strategy', 'Relationship Building', 'Negotiation', 'CRM']),

('Customer Success Manager', 'Customer Support', '£30k-£60k', 60,
 ARRAY['CSM', 'Account Success Manager', 'Customer Experience Manager'],
 ARRAY['Customer Relations', 'Problem Solving', 'Communication', 'Analytics']),

-- Finance & Business
('Business Analyst', 'Business', '£30k-£60k', 65,
 ARRAY['BA', 'Systems Analyst', 'Process Analyst', 'Data Analyst'],
 ARRAY['Data Analysis', 'Requirements Gathering', 'Process Improvement', 'SQL']),

('Financial Analyst', 'Finance', '£35k-£65k', 60,
 ARRAY['Finance Analyst', 'Investment Analyst', 'Corporate Finance Analyst'],
 ARRAY['Financial Modeling', 'Excel', 'Financial Analysis', 'Reporting']),

('Project Manager', 'Operations', '£35k-£70k', 70,
 ARRAY['Programme Manager', 'Delivery Manager', 'Scrum Master', 'Agile Coach'],
 ARRAY['Project Management', 'Agile', 'Stakeholder Management', 'Risk Management']),

-- Management & Leadership
('Engineering Manager', 'Management', '£60k-£120k', 80,
 ARRAY['Tech Manager', 'Development Manager', 'Software Engineering Manager'],
 ARRAY['People Management', 'Technical Leadership', 'Team Building', 'Strategy']),

('Team Lead', 'Management', '£45k-£85k', 70,
 ARRAY['Tech Lead', 'Lead Developer', 'Squad Lead'],
 ARRAY['Leadership', 'Mentoring', 'Technical Guidance', 'Code Review']),

('Director of Engineering', 'Management', '£80k-£160k', 60,
 ARRAY['VP of Engineering', 'Head of Engineering', 'Chief Technology Officer'],
 ARRAY['Strategic Leadership', 'Organizational Design', 'Technical Vision']);

-- Update search vectors for all inserted records (triggers should handle this automatically)
UPDATE companies SET updated_at = NOW();
UPDATE occupations SET updated_at = NOW();

COMMIT;

-- Verification queries
/*
SELECT 'Companies loaded:' as info, COUNT(*) as count FROM companies;
SELECT 'Occupations loaded:' as info, COUNT(*) as count FROM occupations;

-- Test search functions
SELECT 'Testing company search:' as test;
SELECT * FROM search_companies('google', 5);

SELECT 'Testing occupation search:' as test;
SELECT * FROM search_occupations('software', 5);

SELECT 'Testing mixed search:' as test;
SELECT * FROM search_mixed('product manager', 8);
*/