const express = require('express');
const router = express.Router();
const { calculateLevel } = require('../utils/points');
const { auth, authOnly } = require('../middleware/auth');

router.get('/', authOnly, async (req, res) => {
  const supabase = req.app.locals.supabase;
  let query = supabase.from('users').select('*').order('total_points', { ascending: false });
  if (req.query.email) query = query.eq('email', req.query.email);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  const withLevels = data.map((u) => ({ ...u, level: calculateLevel(u.total_points) }));
  res.json(withLevels);
});

router.post('/', authOnly, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, email, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' });
  const row = { id: req.authUser.id, name, email, role: role || 'intern' };
  const { data, error } = await supabase.from('users').insert([row]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ ...data, level: calculateLevel(data.total_points) });
});

router.get('/:id', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'User not found' });
  res.json({ ...data, level: calculateLevel(data.total_points) });
});

router.patch('/:id', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const isSelf = req.user.id === req.params.id;
  const isFounder = req.user.role === 'founder';
  if (!isSelf && !isFounder) return res.status(403).json({ error: 'You can only edit your own profile' });
  const { role, skills, name } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (skills) updates.skills = skills;
  if (role) {
    if (!isFounder) return res.status(403).json({ error: 'Only a founder can change roles' });
    updates.role = role;
  }
  const { data, error } = await supabase.from('users').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
