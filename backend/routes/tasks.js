const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
  if (req.query.assigned_user) query = query.eq('assigned_user', req.query.assigned_user);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', auth, requireRole('founder', 'team_member'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { title, assigned_user, priority, deadline, points, project_id } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ title, assigned_user, priority, deadline, points, project_id, status: 'todo' }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  // Notify the assignee that a task has been assigned to them (Section 5.7)
  if (assigned_user) {
    await supabase.from('notifications').insert([{
      user_id: assigned_user,
      type: 'task_assignment',
      title: 'New task assigned',
      message: `You've been assigned: ${title}`,
    }]);
  }

  res.status(201).json(data);
});

router.patch('/:id', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: existing, error: fetchError } = await supabase
    .from('tasks').select('assigned_user').eq('id', req.params.id).single();
  if (fetchError || !existing) return res.status(404).json({ error: 'Task not found' });
  const isOwner = existing.assigned_user === req.user.id;
  const isFounder = req.user.role === 'founder';
  if (!isOwner && !isFounder) return res.status(403).json({ error: 'You can only update tasks assigned to you' });
  const { status, priority, deadline } = req.body;
  const updates = {};
  if (status) updates.status = status;
  if (priority !== undefined) {
    if (!isFounder) return res.status(403).json({ error: 'Only a founder can change priority' });
    updates.priority = priority;
  }
  if (deadline !== undefined) {
    if (!isFounder) return res.status(403).json({ error: 'Only a founder can change the deadline' });
    updates.deadline = deadline;
  }
  const { data, error } = await supabase.from('tasks').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
