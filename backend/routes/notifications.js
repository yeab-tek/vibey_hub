const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  if (!req.query.user_id) return res.status(400).json({ error: 'user_id query param is required' });
  if (req.query.user_id !== req.user.id && req.user.role !== 'founder') {
    return res.status(403).json({ error: "Cannot view another user's notifications" });
  }
  const { data, error } = await supabase
    .from('notifications').select('*').eq('user_id', req.query.user_id).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/mark-all-read', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  if (user_id !== req.user.id && req.user.role !== 'founder') {
    return res.status(403).json({ error: "Cannot modify another user's notifications" });
  }
  const { data, error } = await supabase
    .from('notifications').update({ is_read: true }).eq('user_id', user_id).eq('is_read', false).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ updated: data.length });
});

router.patch('/:id', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: existing, error: fetchError } = await supabase
    .from('notifications').select('user_id').eq('id', req.params.id).single();
  if (fetchError || !existing) return res.status(404).json({ error: 'Notification not found' });
  if (existing.user_id !== req.user.id && req.user.role !== 'founder') {
    return res.status(403).json({ error: "Cannot modify another user's notifications" });
  }
  const { data, error } = await supabase
    .from('notifications').update({ is_read: true }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
