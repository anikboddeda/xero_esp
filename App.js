// App.js
var { useState, useEffect, useCallback } = React;

function App() {
  const [state, setState] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("global"); 
  const [formOpen, setFormOpen] = useState(null); // 'A' | 'B' | 'final' | null
  const [saveFlash, setSaveFlash] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setState(raw ? JSON.parse(raw) : defaultState());
    } catch {
      setState(defaultState());
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((next) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 900);
    } catch {}
  }, []);

  if (!loaded || !state) {
    return <div className="ff-loading"><div className="pulse">LOADING SYSTEM...</div></div>;
  }

  // Action Handlers
  const handleRegister = (form) => {
    const newTeam = { id: `t${Date.now()}`, ...form };
    persist({ ...state, teams: [...state.teams, newTeam] });
  };

  const toggleGroup = (teamId, group) => {
    let next = { ...state };
    if (group === "A") {
      next.groupA = next.groupA.includes(teamId) ? next.groupA.filter(id => id !== teamId) : [...next.groupA, teamId];
    } else {
      next.groupB = next.groupB.includes(teamId) ? next.groupB.filter(id => id !== teamId) : [...next.groupB, teamId];
    }
    persist(next);
  };

  const addMatch = (group, results, map) => {
    const num = state.groupMatches.filter((m) => m.group === group).length + 1;
    persist({
      ...state,
      groupMatches: [...state.groupMatches, { id: `${group}m${Date.now()}`, group, label: `Match ${num}`, map, results }],
    });
    setFormOpen(null);
  };

  const addFinalMatch = (results, map) => {
    const num = state.finalMatches.length + 1;
    persist({
      ...state,
      finalMatches: [...state.finalMatches, { id: `fm${Date.now()}`, label: `Final ${num}`, map, results }],
    });
    setFormOpen(null);
  };

  const removeGroupMatch = (id) => persist({ ...state, groupMatches: state.groupMatches.filter(m => m.id !== id) });
  const removeFinalMatch = (id) => persist({ ...state, finalMatches: state.finalMatches.filter(m => m.id !== id) });

  // Computed State
  const globalMatches = [...state.groupMatches, ...state.finalMatches];
  const globalStandings = computeStandings(state.teams.map(t => t.id), state.teams, globalMatches);
  const groupAStandings = computeStandings(state.groupA, state.teams, state.groupMatches.filter(m => m.group === "A"));
  const groupBStandings = computeStandings(state.groupB, state.teams, state.groupMatches.filter(m => m.group === "B"));
  
  // Finals participants: any team that played in a final match, plus anyone we might want to show. 
  // For now, let's derive it from teams that have results in finalMatches, or just all teams?
  // Let's just show teams that have at least 1 match in finals, or allow the dropdown to select ANY team.
  // We'll calculate standings for all teams in finalMatches.
  const finalsTeamIds = [...new Set(state.finalMatches.flatMap(m => m.results.map(r => r.teamId)))];
  const finalStandings = computeStandings(finalsTeamIds, state.teams, state.finalMatches);

  return (
    <div className="ff-root">
      <header className="ff-header">
        <div className="ff-titleblock">
          <span className="eyebrow">SQUAD BATTLE ROYALE</span>
          <h1>TOURNAMENT CONTROL</h1>
        </div>
        <div className="ff-headeractions">
          <div className={`savechip ${saveFlash ? "show" : ""}`}>SAVED</div>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            if(confirm("Clear all data?")) persist(defaultState());
          }}>Reset Data</button>
        </div>
      </header>

      <nav className="ff-tabs">
        {[
          ["global", "Global Leaderboard"],
          ["register", "Registration"],
          ["setup", "Setup Groups"],
          ["A", "Group A"],
          ["B", "Group B"],
          ["final", "Finals"],
        ].map(([key, lbl]) => (
          <button key={key} className={`tabbtn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
            {lbl}
          </button>
        ))}
      </nav>

      {tab === "global" && (
        <section className="panel">
          <div className="panel-head">
            <h2>Global Leaderboard</h2>
            <span className="hint">Includes points from ALL matches (Groups + Finals). Total Registered: {state.teams.length}</span>
          </div>
          <StandingsTable rows={globalStandings} medalTop3={true} />
        </section>
      )}

      {tab === "register" && (
        <section className="panel" style={{maxWidth: "800px"}}>
          <RegistrationForm onRegister={handleRegister} />
        </section>
      )}

      {tab === "setup" && (
        <section className="panel">
          <div className="panel-head">
            <h2>Group Assignment</h2>
            <span className="hint">Assign registered teams to Group A or Group B</span>
          </div>
          <div style={{display: "flex", gap: "16px", flexWrap: "wrap"}}>
            {/* GROUP A SETUP */}
            <div style={{flex: 1, minWidth: "300px"}}>
              <h3 style={{color: "var(--accent)", fontFamily: "'Teko', sans-serif", fontSize: "20px"}}>GROUP A</h3>
              <div style={{display: "flex", gap: "8px", marginBottom: "12px"}}>
                <SearchableDropdown 
                  options={state.teams.filter(t => !state.groupA.includes(t.id))} 
                  value="" 
                  onChange={(id) => toggleGroup(id, "A")} 
                  placeholder="Select a team to add..." 
                />
              </div>
              <div className="roster-grid">
                {state.groupA.map(id => {
                  const t = state.teams.find(x => x.id === id);
                  if(!t) return null;
                  return (
                    <div className="roster-row" key={id}>
                      <span className="roster-name">{t.name}</span>
                      <button className="btn-x" onClick={() => toggleGroup(id, "A")}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GROUP B SETUP */}
            <div style={{flex: 1, minWidth: "300px"}}>
              <h3 style={{color: "var(--accent-b)", fontFamily: "'Teko', sans-serif", fontSize: "20px"}}>GROUP B</h3>
              <div style={{display: "flex", gap: "8px", marginBottom: "12px"}}>
                <SearchableDropdown 
                  options={state.teams.filter(t => !state.groupB.includes(t.id))} 
                  value="" 
                  onChange={(id) => toggleGroup(id, "B")} 
                  placeholder="Select a team to add..." 
                />
              </div>
              <div className="roster-grid">
                {state.groupB.map(id => {
                  const t = state.teams.find(x => x.id === id);
                  if(!t) return null;
                  return (
                    <div className="roster-row" key={id}>
                      <span className="roster-name">{t.name}</span>
                      <button className="btn-x" onClick={() => toggleGroup(id, "B")}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {(tab === "A" || tab === "B") && (
        <section className="panel">
          <div className="panel-head">
            <h2>Group {tab} Leaderboard</h2>
            <button className="btn btn-accent btn-sm" onClick={() => setFormOpen(tab)}>
              + Log Match
            </button>
          </div>
          
          {formOpen === tab && (
            <MatchForm
              allTeams={state.teams}
              availableTeamIds={tab === "A" ? state.groupA : state.groupB}
              label={`Group ${tab} Match`}
              onCancel={() => setFormOpen(null)}
              onSubmit={(results, map) => addMatch(tab, results, map)}
            />
          )}

          <StandingsTable rows={tab === "A" ? groupAStandings : groupBStandings} highlightTop={6} />
          <p className="hint" style={{marginTop: "8px"}}>Points shown are from Group {tab} matches only.</p>

          <div className="matchlog">
            {state.groupMatches.filter(m => m.group === tab).map(m => (
              <div className="matchlog-row" key={m.id}>
                <span>{m.label} <span className="mapchip">{m.map}</span></span>
                <button className="btn-x" onClick={() => removeGroupMatch(m.id)}>Delete</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "final" && (
        <section className="panel">
          <div className="panel-head">
            <h2>Finals Leaderboard</h2>
            <button className="btn btn-accent btn-sm" onClick={() => setFormOpen("final")}>
              + Log Finals Match
            </button>
          </div>

          {formOpen === "final" && (
            <MatchForm
              allTeams={state.teams}
              availableTeamIds={state.teams.map(t=>t.id)} // Any global team can play in finals conceptually
              label={`Finals Match`}
              onCancel={() => setFormOpen(null)}
              onSubmit={addFinalMatch}
            />
          )}

          {finalsTeamIds.length > 0 ? (
            <StandingsTable rows={finalStandings} medalTop3={true} />
          ) : (
            <p className="hint">Log a finals match to see the standings here.</p>
          )}

          <div className="matchlog" style={{marginTop: "16px"}}>
            {state.finalMatches.map(m => (
              <div className="matchlog-row" key={m.id}>
                <span>{m.label} <span className="mapchip">{m.map}</span></span>
                <button className="btn-x" onClick={() => removeFinalMatch(m.id)}>Delete</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
