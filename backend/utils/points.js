// Level thresholds from spec Section 4.5.
// 0-49 -> New Contributor, 50-149 -> Contributor,
// 150-299 -> Core Contributor, 300+ -> Top Contributor
function calculateLevel(totalPoints) {
  if (totalPoints >= 300) return 'Top Contributor';
  if (totalPoints >= 150) return 'Core Contributor';
  if (totalPoints >= 50) return 'Contributor';
  return 'New Contributor';
}

// Looks up the point value for a difficulty from the admin-editable
// difficulty_settings table, rather than hardcoding 5/10/20/50 anywhere.
async function getPointsForDifficulty(supabase, difficulty) {
  const { data, error } = await supabase
    .from('difficulty_settings')
    .select('points')
    .eq('difficulty', difficulty)
    .single();

  if (error || !data) { 
    throw new Error(`Unknown or missing difficulty setting: ${difficulty}`);
  }
  return data.points;
}

module.exports = { calculateLevel, getPointsForDifficulty };
