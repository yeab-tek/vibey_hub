const express = require('express');
const router = express.Router();
const { getPointsForDifficulty } = require('../utils/points');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  let query = supabase.from('contributions').select('*').order('created_at', { ascending: false });
  if (req.query.user_id) query = query.eq('user_id', req.query.user_id);
  if (req.query.status) query = query.eq('status', req.query.status);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { user_id, title, category, description, evidence_url, difficulty } = req.body;
  if (!user_id || !title || !category || !difficulty) {
    return res.status(400).json({ error: 'user_id, title, category, and difficulty are required' });
  }
  if (user_id !== req.user.id && req.user.role !== 'founder') {
    return res.status(403).json({ error: 'You can only submit contributions for yourself' });
  }
  try {
    const points = await getPointsForDifficulty(supabase, difficulty);
    const { data, error } = await supabase
      .from('contributions')
      .insert([{ user_id, title, category, description, evidence_url, points, status: 'pending' }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    // Notify founders that a new contribution needs review (Section 5.7)
    const { data: founders } = await supabase.from('users').select('id').eq('role', 'founder');
    if (founders && founders.length > 0) {
      await supabase.from('notifications').insert(
        founders.map((f) => ({
          user_id: f.id,
          type: 'approval_needed',
          title: 'New contribution needs review',
          message: `${title} was submitted and is awaiting approval.`,
        }))
    );
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', auth, requireRole('founder'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { status, reviewer_note } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved, rejected, or pending' });
  }
  const { data, error } = await supabase
    .from('contributions').update({ status, reviewer_note }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
