const { createClient } = require('@supabase/supabase-js');

function requireAuth(supabaseUrl, supabaseServiceKey) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  return async function (req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) {
      return res.status(401).json({ error: 'User profile not found' });
    }
    req.user = profile;
    next();
  };
}

function requireAuthOnly(supabaseUrl, supabaseServiceKey) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  return async function (req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.authUser = { id: user.id, email: user.email };
    next();
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

module.exports = {
  requireAuth,
  requireAuthOnly,
  requireRole,
  auth: requireAuth(supabaseUrl, supabaseServiceKey),
  authOnly: requireAuthOnly(supabaseUrl, supabaseServiceKey),
};
