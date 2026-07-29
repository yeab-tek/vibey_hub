require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { requireAuth, requireRole } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Single shared Supabase client (service role key - backend only, never expose to frontend)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
app.locals.supabase = supabase;

// Public health check - must stay above requireAuth so it doesn't need a token
app.get('/', (req, res) => {
  res.json({ status: 'Vibey Hub API running' });
});

// Everything below this line requires a valid Supabase session token
app.use(requireAuth(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/contributions', require('./routes/contributions'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/milestones', require('./routes/milestones'));
app.use('/api/difficulty-settings', require('./routes/settings'));
app.use('/api/incentives', require('./routes/incentives'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/notifications', require('./routes/notifications'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Vibey Hub backend running on port ${PORT}`));

module.exports = app;
