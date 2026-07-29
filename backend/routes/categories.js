const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('contribution_categories').select('*').order('name', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
