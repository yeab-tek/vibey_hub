require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./vibey-hub-openapi.json');
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Single shared Supabase client (service role key - backend only, never expose to frontend)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
app.locals.supabase = supabase;

// Public health check
app.get('/', (req, res) => {
  res.json({ status: 'Vibey Hub API running' });
});

// Public client portal - accessed via unguessable share_token, no login (Section 5.5)
app.use('/api/portal', require('./routes/portal'));

// Routes - each route file applies its own auth / authOnly / requireRole
// middleware per-endpoint (see middleware/auth.js)
app.use('/api/users', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/contributions', require('./routes/contributions'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/milestones', require('./routes/milestones'));
app.use('/api/difficulty-settings', require('./routes/settings'));
app.use('/api/incentives', require('./routes/incentives'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ai', require('./routes/ai'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Vibey Hub backend running on port ${PORT}`));

module.exports = app;
