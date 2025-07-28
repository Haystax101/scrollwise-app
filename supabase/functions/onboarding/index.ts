// Supabase Edge Function: onboarding
// Receives onboarding data and upserts to normalized tables
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  try {
    const body = await req.json();
    const { user_id, industries, experiences, education, projects, career_goals } = body;
    const supabase: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Upsert industries
    if (Array.isArray(industries)) {
      for (const industry of industries) {
        await supabase.from('user_industries').upsert({
          user_id,
          industry_id: industry.id,
        }, { onConflict: 'user_id,industry_id' });
      }
    }

    // Upsert experiences
    if (Array.isArray(experiences)) {
      for (const exp of experiences) {
        // Upsert company if needed
        let company_id = exp.company_id;
        if (!company_id && exp.company_name) {
          const { data: company, error } = await supabase
            .from('companies')
            .select('id')
            .eq('name', exp.company_name)
            .maybeSingle();
          if (company?.id) company_id = company.id;
          else {
            const { data: newCompany } = await supabase
              .from('companies')
              .insert({ name: exp.company_name })
              .select('id')
              .single();
            company_id = newCompany?.id;
          }
        }
        await supabase.from('user_experiences').insert({
          user_id,
          company_id,
          title: exp.title ?? '',
          description: exp.description ?? '',
          experience_level: exp.experience_level ?? '',
        });
      }
    }

    // Upsert education
    if (Array.isArray(education)) {
      for (const edu of education) {
        await supabase.from('user_degrees').upsert({
          user_id,
          degree_id: edu.degree_id,
          stage: edu.stage ?? '',
        }, { onConflict: 'user_id,degree_id' });
        await supabase.from('user_universities').upsert({
          user_id,
          university_id: edu.university_id,
        }, { onConflict: 'user_id,university_id' });
      }
    }

    // Upsert projects
    if (Array.isArray(projects)) {
      for (const project of projects) {
        await supabase.from('user_projects').insert({
          user_id,
          title: project.title ?? '',
          description: project.description ?? '',
        });
      }
    }

    // Upsert career goals
    if (career_goals) {
      await supabase.from('user_goals').upsert({
        user_id,
        goal: career_goals.goal ?? '',
      }, { onConflict: 'user_id' });
      if (Array.isArray(career_goals.target_companies)) {
        for (const company_id of career_goals.target_companies) {
          await supabase.from('user_goal_companies').upsert({
            user_id,
            company_id,
          }, { onConflict: 'user_id,company_id' });
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
