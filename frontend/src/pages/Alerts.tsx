import './Page.css';

const ALERTS = [
  { id: 'ALT-001', severity: 'critical', message: 'Unit DRN-10 unresponsive — last ping 4h ago', unit: 'DRN-10', time: '04:12' },
  { id: 'ALT-002', severity: 'warning', message: 'Low battery — Unit DRN-09 at 18%', unit: 'DRN-09', time: '09:41' },
  { id: 'ALT-003', severity: 'warning', message: 'Unit DRN-06 scheduled maintenance overdue by 2 days', unit: 'DRN-06', time: '08:00' },
  { id: 'ALT-004', severity: 'info', message: 'Mission Charlie-1 launch window opens in 30 min', unit: '—', time: '09:58' },
  { id: 'ALT-005', severity: 'info', message: 'Firmware v3.4.1 available for 6 units', unit: '—', time: '07:00' },
];

function Alerts() {
  const critical = ALERTS.filter((a) => a.severity === 'critical').length;
  const warnings = ALERTS.filter((a) => a.severity === 'warning').length;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Alerts</h1>
        <span className="page-subtitle">{critical} critical · {warnings} warnings</span>
      </div>
      <div className="card">
        <div className="card-header">Active Alerts</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Severity</th>
                <th>Message</th>
                <th>Unit</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {ALERTS.map((a) => (
                <tr key={a.id}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{a.id}</td>
                  <td><span className={`badge badge--${a.severity}`}>{a.severity}</span></td>
                  <td>{a.message}</td>
                  <td style={{ fontFamily: 'monospace' }}>{a.unit}</td>
                  <td>{a.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Alerts;
