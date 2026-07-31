const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { calculateLevel } = require('../utils/points');

// GET /api/ai/summary/:userId?month=2026-08
// Founder-only. Pulls approved contributions for that user/month, computes
// totals, and asks Groq to write a short plain-English summary plus an
// incentive-level recommendation (Section 5.6/9 - AI Assistant).
router.get('/summary/:userId', auth, requireRole('founder'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { userId } = req.params;
  const month = req.query.month; // expected format: 'YYYY-MM'

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'month query param is required, format YYYY-MM' });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, total_points')
    .eq('id', userId)
    .single();
  if (userError || !user) return res.status(404).json({ error: 'User not found' });

  const monthStart = `${month}-01`;
  const [year, monthNum] = month.split('-').map(Number);
  const nextMonth = monthNum === 12 ? `${year + 1}-01-01` : `${year}-${String(monthNum + 1).padStart(2, '0')}-01`;

  const { data: contributions, error: contribError } = await supabase
    .from('contributions')
    .select('title, category, points, created_at')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .gte('created_at', monthStart)
    .lt('created_at', nextMonth);
  if (contribError) return res.status(500).json({ error: contribError.message });

  const monthPoints = contributions.reduce((sum, c) => sum + c.points, 0);
  const level = calculateLevel(user.total_points);

  if (contributions.length === 0) {
    return res.json({
      user_id: userId,
      name: user.name,
      month,
      month_points: 0,
      total_points: user.total_points,
      level,
      contribution_count: 0,
      summary: `${user.name} had no approved contributions in ${month}.`,
      incentive_suggestion: 'not_this_month',
    });
  }

  const contributionList = contributions
    .map((c) => `- ${c.title} (${c.category}, ${c.points} pts)`)
    .join('\n');

  const prompt = `You are summarizing a team member's monthly work for a founder reviewing incentives.

Name: ${user.name}
Month: ${month}
Approved contributions this month:
${contributionList}

Total points this month: ${monthPoints}
All-time total points: ${user.total_points}
Current level: ${level}

Write a short (2-3 sentence) plain-English summary of their contributions this month, in a warm but professional tone. Then on a new line, suggest one of exactly these incentive decisions: "approved", "not_this_month", or "custom" - based on whether this month's output seems to merit recognition. Respond in this exact format:

SUMMARY: <your summary here>
SUGGESTION: <approved|not_this_month|custom>`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 300,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(502).json({ error: `Groq API error: ${groqRes.status} ${errText}` });
    }

    const groqData = await groqRes.json();
    const text = groqData.choices?.[0]?.message?.content || '';

    const summaryMatch = text.match(/SUMMARY:\s*(.+?)(?:\r?\n|$)/s);
    const suggestionMatch = text.match(/SUGGESTION:\s*(approved|not_this_month|custom)/i);

    res.json({
      user_id: userId,
      name: user.name,
      month,
      month_points: monthPoints,
      total_points: user.total_points,
      level,
      contribution_count: contributions.length,
      summary: summaryMatch ? summaryMatch[1].trim() : text.trim(),
      incentive_suggestion: suggestionMatch ? suggestionMatch[1].toLowerCase() : null,
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to generate summary: ${err.message}` });
  }
});


// POST /api/ai/chat - Q&A assistant for any logged-in user (surfaced in the
// UI for interns). Answers general Vibey Hub questions and can reference
// the caller's own open tasks. Never exposes other people's data.
router.post('/chat', auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { message, history } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('name, role, total_points')
    .eq('id', req.user.id)
    .single();
  const roleLabelMap = { founder: 'Founder', team_member: 'Team Member', intern: 'Intern', client: 'Client' };
  const level = calculateLevel(profile?.total_points || 0);

  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, status, priority, deadline')
    .eq('assigned_user', req.user.id)
    .neq('status', 'done')
    .order('deadline', { ascending: true })
    .limit(5);

  const { data: difficulties } = await supabase
    .from('difficulty_settings')
    .select('difficulty, points')
    .order('points', { ascending: true });
  const { data: categories } = await supabase.from('contribution_categories').select('name');

  const difficultyText = (difficulties || []).map((d) => `${d.difficulty} = ${d.points} pts`).join(', ');
  const categoryText = (categories || []).map((c) => c.name).join(', ');
  const taskText = tasks && tasks.length > 0
    ? tasks.map((t) => `- ${t.title} (${t.status}, ${t.priority} priority${t.deadline ? `, due ${t.deadline}` : ''})`).join('\n')
    : 'No open tasks right now.';

  const systemPrompt = `You are the Vibey Hub assistant, helping a ${profile?.role || 'team'} member named ${profile?.name || 'there'} understand the platform and their work.

About Vibey Hub: it's Vibey World's internal system for tracking tasks, contributions, and incentives.
- Contribution categories: ${categoryText}
- Difficulty point values: ${difficultyText}
- Levels are based on total points: 0-49 New Contributor, 50-149 Contributor, 150-299 Core Contributor, 300+ Top Contributor.
- To submit a contribution: go to the Contributions page, pick a category and difficulty, add a short description and optional evidence link, then submit for founder approval.
- To update a task: go to the Tasks page and change its status as you make progress.

${profile?.name || 'This person'}'s current level: ${level} (${profile?.total_points || 0} points).
Their current open tasks:
${taskText}

${profile?.name || 'This person'}'s role at Vibey World: ${roleLabelMap[profile?.role] || profile?.role || 'unknown'}.\n\nAnswer their question directly and warmly, in 2-4 sentences. If they ask about their own role, level, or points - including phrasings like 'how do I check', 'how can I see', 'am I a...', or 'what is my...' - just tell them the answer directly and confidently using the information above (e.g. 'You're a Team Member at Vibey World.'). Never describe a UI navigation path for something you already know the answer to, and never say you don't have access to it. If they ask about a specific task, use the task list above. Only say you're unsure if the answer genuinely isn't covered by anything above.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(Array.isArray(history) ? history.slice(-6) : []),
    { role: 'user', content: message },
  ];

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.5,
        max_tokens: 400,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(502).json({ error: `Groq API error: ${groqRes.status} ${errText}` });
    }

    const groqData = await groqRes.json();
    const reply = groqData.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't come up with an answer.";
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: `Failed to get response: ${err.message}` });
  }
});

module.exports = router;
