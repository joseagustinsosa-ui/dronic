import StatCard from '../components/StatCard';
import './Page.css';
import './Dashboard.css';

const RECENT_ACTIVITY = [
  { id: 1, event: 'Mission Alpha-7 completed', time: '2 min ago', status: 'success' },
  { id: 2, event: 'Unit DRN-04 returned to base', time: '11 min ago', status: 'success' },
  { id: 3, event: 'Low battery warning — Unit DRN-09', time: '23 min ago', status: 'warning' },
  { id: 4, event: 'Mission Bravo-3 launched', time: '34 min ago', status: 'info' },
  { id: 5, event: 'Unit DRN-12 firmware updated', time: '1 hr ago', status: 'info' },
];

function Dashboard() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span className="page-subtitle">Overview — March 10, 2026</span>
      </div>

      <div className="stats-grid">
        <StatCard label="Active Units" value={14} trend="up" trendValue="2 from yesterday" accent="blue" />
        <StatCard label="Missions Today" value={27} trend="up" trendValue="6 vs last week" accent="green" />
        <StatCard label="Alerts" value={3} trend="down" trendValue="5 resolved" accent="orange" />
        <StatCard label="Fleet Uptime" value="98.4" unit="%" trend="neutral" trendValue="stable" accent="green" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">Recent Activity</div>
          <ul className="activity-list">
            {RECENT_ACTIVITY.map((item) => (
              <li key={item.id} className="activity-item">
                <span className={`activity-dot activity-dot--${item.status}`} />
                <div className="activity-content">
                  <span className="activity-event">{item.event}</span>
                  <span className="activity-time">{item.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="card-header">Fleet Status</div>
          <div className="fleet-status-list">
            {[
              { label: 'Active', count: 14, color: 'var(--accent-green)' },
              { label: 'Idle', count: 6, color: 'var(--accent)' },
              { label: 'Maintenance', count: 2, color: 'var(--accent-orange)' },
              { label: 'Offline', count: 1, color: 'var(--accent-red)' },
            ].map((s) => (
              <div key={s.label} className="fleet-status-row">
                <div className="fleet-status-label">
                  <span className="fleet-status-dot" style={{ backgroundColor: s.color }} />
                  {s.label}
                </div>
                <div className="fleet-status-bar-wrap">
                  <div
                    className="fleet-status-bar"
                    style={{ width: `${(s.count / 23) * 100}%`, backgroundColor: s.color }}
                  />
                </div>
                <span className="fleet-status-count">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
