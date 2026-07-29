const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('difficulty_settings').select('*').order('points', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/:id', auth, requireRole('founder'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { points } = req.body;
  if (points === undefined) return res.status(400).json({ error: 'points is required' });
  const { data, error } = await supabase
    .from('difficulty_settings').update({ points: Number(points) }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
