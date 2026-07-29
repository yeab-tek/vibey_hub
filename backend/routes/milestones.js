const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');

router.patch('/:id', auth, requireRole('founder', 'team_member'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { status, deadline } = req.body;
  const updates = {};
  if (status) updates.status = status;
  if (deadline) updates.deadline = deadline;
  const { data, error } = await supabase.from('milestones').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
