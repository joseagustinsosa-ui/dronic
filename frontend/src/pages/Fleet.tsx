import './Page.css';

const UNITS = [
  { id: 'DRN-01', model: 'Apex X1', status: 'idle', battery: 92, location: 'Base Alpha', missions: 214 },
  { id: 'DRN-02', model: 'Apex X1', status: 'idle', battery: 100, location: 'Base Alpha', missions: 187 },
  { id: 'DRN-03', model: 'Apex X2', status: 'active', battery: 74, location: 'Sector A', missions: 301 },
  { id: 'DRN-04', model: 'Apex X2', status: 'idle', battery: 88, location: 'Base Beta', missions: 256 },
  { id: 'DRN-05', model: 'Vector S', status: 'idle', battery: 100, location: 'Base Alpha', missions: 98 },
  { id: 'DRN-06', model: 'Vector S', status: 'maintenance', battery: 45, location: 'Hangar 1', missions: 143 },
  { id: 'DRN-07', model: 'Apex X2', status: 'active', battery: 61, location: 'Sector B', missions: 178 },
  { id: 'DRN-08', model: 'Vector S', status: 'idle', battery: 100, location: 'Base Beta', missions: 67 },
  { id: 'DRN-09', model: 'Apex X1', status: 'active', battery: 18, location: 'Sector C', missions: 322 },
  { id: 'DRN-10', model: 'Apex X2', status: 'offline', battery: 0, location: 'Hangar 2', missions: 411 },
];

function BatteryBar({ level }: { level: number }) {
  const color = level > 50 ? 'var(--accent-green)' : level > 20 ? 'var(--accent-orange)' : 'var(--accent-red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${level}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 32, textAlign: 'right' }}>{level}%</span>
    </div>
  );
}

function Fleet() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Fleet</h1>
        <span className="page-subtitle">{UNITS.length} units registered</span>
      </div>
      <div className="card">
        <div className="card-header">Unit Registry</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Unit ID</th>
                <th>Model</th>
                <th>Status</th>
                <th>Battery</th>
                <th>Location</th>
                <th>Missions</th>
              </tr>
            </thead>
            <tbody>
              {UNITS.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{u.id}</td>
                  <td>{u.model}</td>
                  <td><span className={`badge badge--${u.status}`}>{u.status}</span></td>
                  <td style={{ minWidth: 130 }}><BatteryBar level={u.battery} /></td>
                  <td>{u.location}</td>
                  <td>{u.missions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Fleet;
