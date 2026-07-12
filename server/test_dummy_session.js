const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('booking_sessions').insert({
    teacher_id: 'a67f501d-8bcb-4425-bfa9-abcf70c91794', // Some valid UUID
    learner_id: '0ca477ae-2263-4b18-9f6e-0e38827ef30c', // Some valid UUID
    scheduled_at: new Date().toISOString(),
    status: 'completed',
    agenda: 'Direct Profile Rating'
  }).select('*').single();
  
  if (error) {
    console.error('Error inserting dummy session:', error);
  } else {
    console.log('Dummy session created:', data);
  }
}

test();
