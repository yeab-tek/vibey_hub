const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('projects').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Project not found' });
  res.json(data);
});

router.post('/', auth, requireRole('founder'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, client_name, project_type, budget, status, start_date, deadline } = req.body;
  if (!name || !client_name) return res.status(400).json({ error: 'name and client_name are required' });
  const { data, error } = await supabase
    .from('projects')
    .insert([{ name, client_name, project_type, budget, status: status || 'lead', start_date, deadline, created_by: req.user.id }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', auth, requireRole('founder'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const allowed = ['name', 'client_name', 'project_type', 'budget', 'status', 'start_date', 'deadline'];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  const { data, error } = await supabase.from('projects').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id/milestones', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('milestones').select('*').eq('project_id', req.params.id).order('deadline', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/:id/milestones', auth, requireRole('founder'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, deadline } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const { data, error } = await supabase
    .from('milestones')
    .insert([{ project_id: req.params.id, name, deadline, status: 'not_started' }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

module.exports = router;
