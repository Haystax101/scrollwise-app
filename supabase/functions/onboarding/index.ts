// Supabase Edge Function: onboarding
// Receives onboarding data and upserts to normalized tables
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  console.log('Onboarding function invoked');
  try {
    const body = await req.json();
    console.log('Request body:', body);
    const { industries, workExperience, education, projects, careerGoals } = body;

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get user from the authorization header
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');
    const user_id = user.id;
    console.log(`Processing onboarding for user_id: ${user_id}`);

    // Upsert industries
    if (industries && Array.isArray(industries.selectedIndustries)) {
      console.log('Processing industries:', industries.selectedIndustries);
      for (const industry of industries.selectedIndustries) {
        console.log('Upserting industry:', industry);
        const { data, error } = await supabaseAdmin.from('user_industries').upsert({
          user_id,
          industry_id: industry.id,
        }, { onConflict: 'user_id,industry_id' });
        if (error) console.error('Error upserting industry:', error);
        else console.log('Successfully upserted industry:', data);
      }
    }

    // Upsert experiences
    const experiences = workExperience ? [workExperience] : [];
    if (Array.isArray(experiences)) {
      console.log('Processing experiences:', experiences);
      for (const exp of experiences) {
        console.log('Processing experience:', exp);
        let company_id = exp.company_id;
        if (!company_id && exp.company) {
          console.log('Finding or creating company:', exp.company);
          const { data: companyData, error: companyError } = await supabaseAdmin
            .from('companies')
            .select('id')
            .eq('name', exp.company)
            .maybeSingle();
          if (companyError) console.error('Error finding company:', companyError);
          if (companyData?.id) {
            company_id = companyData.id;
            console.log('Found company with ID:', company_id);
          } else {
            console.log('Creating new company');
            const { data: newCompany, error: newCompanyError } = await supabaseAdmin
              .from('companies')
              .insert({ name: exp.company })
              .select('id')
              .single();
            if (newCompanyError) console.error('Error creating company:', newCompanyError);
            else {
              company_id = newCompany?.id;
              console.log('Created new company with ID:', company_id);
            }
          }
        }
        console.log('Inserting user experience');
        const { data, error } = await supabaseAdmin.from('user_experiences').insert({
          user_id,
          company_id,
          description: exp.description ?? '',
          experience_level: exp.experienceLevel ?? '',
        });
        if (error) console.error('Error inserting user experience:', error);
        else console.log('Successfully inserted user experience:', data);
      }
    }

    // Upsert education
    const educationHistory = education ? [education] : [];
    if (Array.isArray(educationHistory)) {
      console.log('Processing education:', educationHistory);
      for (const edu of educationHistory) {
        console.log('Processing education item:', edu);

        let degree_id = edu.degree_id;
        if (!degree_id && edu.degree) {
            const { data: degreeData, error: degreeErr } = await supabaseAdmin.from('degrees').select('id').eq('name', edu.degree).single();
            if (degreeErr) console.error('Error fetching degree id:', degreeErr);
            else degree_id = degreeData.id;
        }

        let university_id = edu.university_id;
        if (!university_id && edu.institution) {
            const { data: uniData, error: uniErr } = await supabaseAdmin.from('universities').select('id').eq('name', edu.institution).single();
            if (uniErr) console.error('Error fetching university id:', uniErr);
            else university_id = uniData.id;
        }

        console.log('Inserting user education');
        const { data, error } = await supabaseAdmin.from('user_education').insert({
          user_id,
          university_id,
          degree_id,
          stage: edu.stage ?? '',
        });
        if (error) console.error('Error inserting user education:', error);
        else console.log('Successfully inserted user education:', data);
      }
    }

    // Upsert projects
    const projectList = Array.isArray(projects) ? projects : (projects?.projects);
    if (Array.isArray(projectList)) {
      console.log('Processing projects:', projectList);
      for (const project of projectList) {
        console.log('Inserting project:', project);
        const { data, error } = await supabaseAdmin.from('user_projects').insert({
          user_id,
          title: project.name ?? '',
          description: project.description ?? '',
        });
        if (error) console.error('Error inserting project:', error);
        else console.log('Successfully inserted project:', data);
      }
    }

    // Upsert career goals
    if (careerGoals) {
      console.log('Processing career goals:', careerGoals);
      console.log('Upserting user goal');
      const { data, error } = await supabaseAdmin.from('user_goals').upsert({
        user_id,
        goal: careerGoals.goal ?? '',
        timeframe: careerGoals.timeframe ?? '',
      }, { onConflict: 'user_id' });
      if (error) console.error('Error upserting user goal:', error);
      else console.log('Successfully upserted user goal:', data);

      if (Array.isArray(careerGoals.target_companies)) {
        console.log('Processing target companies:', careerGoals.target_companies);
        for (const company_id of careerGoals.target_companies) {
          console.log('Upserting user goal company:', company_id);
          const { data: goalCoData, error: goalCoError } = await supabaseAdmin.from('user_goal_companies').upsert({
            user_id,
            company_id,
          }, { onConflict: 'user_id,company_id' });
          if (goalCoError) console.error('Error upserting user goal company:', goalCoError);
          else console.log('Successfully upserted user goal company:', goalCoData);
        }
      }
    }

    console.log('Onboarding function finished successfully');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in onboarding function:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
