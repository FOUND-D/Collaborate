const supabase = require('../lib/supabase');

const connectDB = async () => {
  const { error } = await supabase.from('users').select('id').limit(1);
  if (error && !String(error.message || '').includes('permission')) {
    console.warn('Supabase connection check returned:', error.message);
  }
  console.log('Supabase connection ready');
};

module.exports = connectDB;
