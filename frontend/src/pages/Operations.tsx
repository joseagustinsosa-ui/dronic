import './Page.css';

const MISSIONS = [
  { id: 'OPS-001', name: 'Alpha-7', unit: 'DRN-03', status: 'running', start: '08:14', duration: '1h 42m', zone: 'Sector A' },
  { id: 'OPS-002', name: 'Bravo-3', unit: 'DRN-07', status: 'running', start: '09:05', duration: '51m', zone: 'Sector B' },
  { id: 'OPS-003', name: 'Charlie-1', unit: 'DRN-11', status: 'pending', start: '10:30', duration: '—', zone: 'Sector C' },
  { id: 'OPS-004', name: 'Delta-9', unit: 'DRN-02', status: 'completed', start: '06:00', duration: '2h 05m', zone: 'Sector A' },
  { id: 'OPS-005', name: 'Echo-4', unit: 'DRN-05', status: 'completed', start: '07:30', duration: '58m', zone: 'Sector D' },
  { id: 'OPS-006', name: 'Foxtrot-2', unit: 'DRN-08', status: 'pending', start: '11:00', duration: '—', zone: 'Sector B' },
];

function Operations() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Operations</h1>
        <span className="page-subtitle">{MISSIONS.length} missions logged today</span>
      </div>
      <div className="card">
        <div className="card-header">Mission Log</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Mission</th>
                <th>Unit</th>
                <th>Status</th>
                <th>Start</th>
                <th>Duration</th>
                <th>Zone</th>
              </tr>
            </thead>
            <tbody>
              {MISSIONS.map((m) => (
                <tr key={m.id}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{m.id}</td>
                  <td>{m.name}</td>
                  <td style={{ fontFamily: 'monospace' }}>{m.unit}</td>
                  <td><span className={`badge badge--${m.status}`}>{m.status}</span></td>
                  <td>{m.start}</td>
                  <td>{m.duration}</td>
                  <td>{m.zone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Operations;
