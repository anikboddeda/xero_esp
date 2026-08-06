// components.js
var { useState, useEffect, useRef } = React;

function SearchableDropdown({ options, value, onChange, placeholder }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  
  const selectedOption = options.find(o => o.id === value);
  
  useEffect(() => {
    if (!open) {
      if (selectedOption) setQuery(selectedOption.name);
      else setQuery("");
    }
  }, [value, selectedOption, open]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="search-dropdown" ref={containerRef}>
      <input 
        type="text" 
        value={query} 
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setQuery(""); setOpen(true); }}
        placeholder={placeholder}
      />
      {open && (
        <div className="search-dropdown-list">
          {filtered.map(o => (
            <div 
              key={o.id} 
              className="search-dropdown-item" 
              onClick={() => { onChange(o.id); setOpen(false); }}
            >
              {o.name}
            </div>
          ))}
          {filtered.length === 0 && <div className="search-dropdown-item hint">No teams found</div>}
        </div>
      )}
    </div>
  );
}

function RegistrationForm({ onRegister }) {
  const [form, setForm] = useState({ name: "", p1: "", p2: "", p3: "", p4: "", captain: "", phone: "" });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Team name is required");
    onRegister(form);
    setForm({ name: "", p1: "", p2: "", p3: "", p4: "", captain: "", phone: "" });
  };

  return (
    <form className="matchform" onSubmit={handleSubmit}>
      <div className="matchform-head">Register New Team</div>
      <div className="matchform-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div><label className="hint">Team Name *</label><input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="E.g. Galaxy Racers" /></div>
        <div><label className="hint">Contact Number</label><input value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} placeholder="+91..." /></div>
        <div><label className="hint">Captain Name</label><input value={form.captain} onChange={e=>setForm({...form, captain: e.target.value})} placeholder="In-game Name" /></div>
        <div style={{gridColumn: "1 / -1"}}><hr style={{border:"none", borderTop:"1px solid var(--border)"}}/></div>
        <div><label className="hint">Player 1</label><input value={form.p1} onChange={e=>setForm({...form, p1: e.target.value})} /></div>
        <div><label className="hint">Player 2</label><input value={form.p2} onChange={e=>setForm({...form, p2: e.target.value})} /></div>
        <div><label className="hint">Player 3</label><input value={form.p3} onChange={e=>setForm({...form, p3: e.target.value})} /></div>
        <div><label className="hint">Player 4</label><input value={form.p4} onChange={e=>setForm({...form, p4: e.target.value})} /></div>
      </div>
      <div className="matchform-actions">
        <button type="submit" className="btn btn-accent">Register Team</button>
      </div>
    </form>
  );
}

function MatchForm({ allTeams, availableTeamIds, onSubmit, onCancel, label, defaultMap }) {
  const NUM_ROWS = 12;
  const [results, setResults] = useState(
    Array.from({length: NUM_ROWS}, () => ({ teamId: "", placement: "", kills: "" }))
  );
  const [map, setMap] = useState(defaultMap || MAPS[0]);
  
  // Teams that are available to be selected in this match
  const availableOptions = allTeams.filter(t => availableTeamIds.includes(t.id));

  const update = (idx, field, value) => {
    setResults(rs => rs.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const validResults = results.filter(r => r.teamId && r.placement !== "" && Number(r.placement) >= 1);
  const canSubmit = validResults.length > 0;

  return (
    <div className="matchform">
      <div className="matchform-head">Log {label}</div>
      <div style={{display:"flex", gap:"16px", marginBottom: "16px", alignItems:"center"}}>
        <label className="hint" style={{display:"flex", alignItems:"center", gap:"8px"}}>
          Map:
          <select style={{padding: "6px", background:"var(--panel)", color:"var(--text)", border:"1px solid var(--border)", borderRadius:"4px"}} value={map} onChange={(e) => setMap(e.target.value)}>
            {MAPS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <span className="hint">Log as many teams as you want, then save.</span>
      </div>
      
      <div className="matchform-grid">
        <div className="matchform-row matchform-row--header">
          <span>Team (Search)</span>
          <span>Placement</span>
          <span>Kills</span>
        </div>
        {results.map((r, idx) => (
          <div className="matchform-row" key={idx}>
            <SearchableDropdown 
              options={availableOptions}
              value={r.teamId}
              onChange={(val) => update(idx, "teamId", val)}
              placeholder="Select Team"
            />
            <input
              type="number" min="1" max="12"
              value={r.placement}
              onChange={(e) => update(idx, "placement", e.target.value)}
              placeholder="#"
            />
            <input
              type="number" min="0"
              value={r.kills}
              onChange={(e) => update(idx, "kills", e.target.value)}
              placeholder="0"
            />
          </div>
        ))}
      </div>
      <div className="matchform-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button
          className="btn btn-accent"
          disabled={!canSubmit}
          onClick={() =>
            onSubmit(
              validResults.map((r) => ({ ...r, placement: Number(r.placement), kills: Number(r.kills) })),
              map
            )
          }
        >
          Save Match
        </button>
      </div>
    </div>
  );
}

function StandingsTable({ rows, highlightTop, medalTop3 }) {
  return (
    <table className="standings">
      <thead>
        <tr>
          <th>#</th>
          <th>Team Name</th>
          <th>Played</th>
          <th>Kills</th>
          <th>Total Points</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr
            key={r.id}
            className={
              medalTop3 && i < 3 ? `medal medal-${i + 1}` : highlightTop && i < highlightTop ? "adv" : ""
            }
          >
            <td>{i + 1}</td>
            <td>{r.name}</td>
            <td>{r.played}</td>
            <td>{r.kills}</td>
            <td className="pts">{r.points}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan="5" style={{textAlign:"center", color:"var(--muted)", padding:"30px"}}>
              No teams available.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
