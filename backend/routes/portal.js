const express = require('express');
const router = express.Router();

// GET /api/portal/:token - public, read-only project progress view.
// No auth required - mounted before any auth middleware in server.js.
// Access is gated only by knowing the unguessable share_token (Section 5.5).
router.get('/:token', async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, client_name, status, start_date, deadline')
    .eq('share_token', req.params.token)
    .single();

  if (error || !project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { data: milestones, error: msError } = await supabase
    .from('milestones')
    .select('name, status, deadline')
    .eq('project_id', project.id)
    .order('deadline', { ascending: true });

  if (msError) return res.status(500).json({ error: msError.message });

  const total = milestones.length;
  const completed = milestones.filter((m) => m.status === 'completed');
  const progressPercent = total > 0 ? Math.round((completed.length / total) * 100) : 0;
  const nextItem = milestones.find((m) => m.status !== 'completed') || null;

  res.json({
    project_name: project.name,
    client_name: project.client_name,
    status: project.status,
    progress_percent: progressPercent,
    completed_items: completed.map((m) => m.name),
    next_item: nextItem ? nextItem.name : null,
  });
});

module.exports = router;
