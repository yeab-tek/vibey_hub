require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header', status: 401 };
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { error: 'Invalid or expired token', status: 401 };
  }
  return { user };
}

// authOnly: verifies the token is valid, but does NOT require a matching
// `users` profile row to exist yet. Attaches req.authUser = { id, email }
// (the raw Supabase auth identity). Use this only on the routes involved
// in creating that very row - GET/POST /api/users - so a brand-new signup
// isn't locked out before their profile can be created.
async function authOnly(req, res, next) {
  const result = await verifyToken(req);
  if (result.error) return res.status(result.status).json({ error: result.error });
  req.authUser = { id: result.user.id, email: result.user.email };
  next();
}

// auth: verifies the token AND requires a matching `users` profile row to
// already exist. Attaches req.user = { id, role }. Use this on every other
// route - anything that needs to know the caller's role or assumes the
// profile is already set up.
async function auth(req, res, next) {
  const result = await verifyToken(req);
  if (result.error) return res.status(result.status).json({ error: result.error });
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', result.user.email)
    .single();
  if (profileError || !profile) {
    return res.status(401).json({ error: 'User profile not found' });
  }
  req.user = { id: profile.id, role: profile.role };
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { auth, authOnly, requireRole };
