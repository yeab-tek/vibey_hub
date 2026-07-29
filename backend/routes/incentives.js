const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  let query = supabase.from('incentives').select('*').order('month', { ascending: false });
  if (req.user.role === 'founder') {
    if (req.query.user_id) query = query.eq('user_id', req.query.user_id);
  } else {
    query = query.eq('user_id', req.user.id);
  }
  if (req.query.month) query = query.eq('month', req.query.month);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', auth, requireRole('founder'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { user_id, month, points, recommended_reward } = req.body;
  if (!user_id || !month) return res.status(400).json({ error: 'user_id and month are required' });
  const { data, error } = await supabase
    .from('incentives').insert([{ user_id, month, points: points || 0, recommended_reward }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', auth, requireRole('founder'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { founder_decision, founder_note } = req.body;
  const updates = {};
  if (founder_decision) updates.founder_decision = founder_decision;
  if (founder_note !== undefined) updates.founder_note = founder_note;
  const { data, error } = await supabase.from('incentives').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
