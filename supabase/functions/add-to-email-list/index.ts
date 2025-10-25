// Supabase Edge Function: add-to-email-list
// Automatically adds new users to Email Octopus drip campaign
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  console.log('add-to-email-list function invoked');

  try {
    const body = await req.json();
    console.log('Request body:', body);

    const { record } = body;

    if (!record || !record.email) {
      throw new Error('No email found in request');
    }

    const userEmail = record.email;
    const userFullName = record.full_name || '';
    console.log(`Processing email signup for: ${userEmail}`);

    // Get Email Octopus credentials from environment
    const emailOctopusApiKey = Deno.env.get('EMAIL_OCTOPUS_API_KEY');
    const emailOctopusListId = Deno.env.get('EMAIL_OCTOPUS_LIST_ID');

    if (!emailOctopusApiKey || !emailOctopusListId) {
      console.error('Missing Email Octopus configuration');
      throw new Error('Email Octopus API key or List ID not configured');
    }

    // Prepare Email Octopus API request
    const emailOctopusUrl = `https://emailoctopus.com/api/1.6/lists/${emailOctopusListId}/contacts`;

    const emailOctopusPayload = {
      api_key: emailOctopusApiKey,
      email_address: userEmail,
      fields: {
        FirstName: userFullName.split(' ')[0] || '',
        FullName: userFullName,
      },
      status: 'SUBSCRIBED',
      tags: ['new_signup', 'app_user'],
    };

    console.log('Sending request to Email Octopus...');

    // Call Email Octopus API
    const response = await fetch(emailOctopusUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailOctopusPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Handle known error codes
      if (responseData.code === 'MEMBER_EXISTS_WITH_EMAIL_ADDRESS') {
        console.log('User already exists in Email Octopus list');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'User already subscribed',
            alreadyExists: true
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      console.error('Email Octopus API error:', responseData);
      throw new Error(`Email Octopus API error: ${responseData.message || 'Unknown error'}`);
    }

    console.log('Successfully added user to Email Octopus:', responseData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User added to email list',
        contactId: responseData.id
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in add-to-email-list function:', error);
    return new Response(
      JSON.stringify({
        error: String(error),
        success: false
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
