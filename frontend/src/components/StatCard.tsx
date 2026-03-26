import './StatCard.css';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accent?: 'blue' | 'green' | 'orange' | 'red';
}

function StatCard({ label, value, unit, trend, trendValue, accent = 'blue' }: StatCardProps) {
  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—';
  const trendClass = trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-neutral';

  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {trendValue && (
        <div className={`stat-trend ${trendClass}`}>
          <span>{trendSymbol}</span>
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}

export default StatCard;
