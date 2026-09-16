// utils.js
const STORAGE_KEY = "ffic-tournament-v3";
const ADMIN_PASSWORD = "anikiloveyou";
const MAPS = ["Bermuda", "Kalahari", "Purgatory"];

// FFIC/FFMIC Points Scheme
const PLACEMENT_PTS = { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0 };
const pts = (place) => PLACEMENT_PTS[place] || 0;

const defaultState = () => ({
  teams: [], // Global list of teams
  tournaments: [], // { id, name, participants: [], groupA: [], groupB: [], groupMatches: [], finalMatches: [] }
  pendingRegistrations: [], // { id, tournamentId, teamId, payerName, status, submittedAt }
});

function computeStandings(teamIds, teams, matches) {
  const rows = teamIds.map((id) => {
    const team = teams.find((t) => t.id === id);
    let points = 0,
      kills = 0,
      played = 0,
      bestPlacement = null;
      
    matches.forEach((m) => {
      const r = m.results.find((res) => res.teamId === id);
      if (r) {
        points += pts(r.placement) + (r.kills || 0);
        kills += (r.kills || 0);
        played += 1;
        if (bestPlacement === null || r.placement < bestPlacement) bestPlacement = r.placement;
      }
    });
    
    return { 
      id, 
      name: team ? team.name : "Unknown", 
      points, 
      kills, 
      played, 
      bestPlacement: bestPlacement ?? 99 
    };
  });
  
  // Sort descending by points, then kills, then best placement
  rows.sort((a, b) => b.points - a.points || b.kills - a.kills || a.bestPlacement - b.bestPlacement);
  return rows;
}
