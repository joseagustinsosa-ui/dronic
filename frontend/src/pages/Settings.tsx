import './Page.css';
import './Settings.css';

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <span className="setting-label">{label}</span>
        {description && <span className="setting-desc">{description}</span>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}

function Toggle({ defaultChecked }: { defaultChecked?: boolean }) {
  return (
    <label className="toggle">
      <input type="checkbox" defaultChecked={defaultChecked} />
      <span className="toggle-track" />
    </label>
  );
}

function Settings() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <span className="page-subtitle">System configuration</span>
      </div>

      <div className="settings-sections">
        <div className="card">
          <div className="card-header">General</div>
          <div className="setting-list">
            <SettingRow label="System Name" description="Display name for this DRONIC instance">
              <input className="text-input" defaultValue="DRONIC — Ops Center" />
            </SettingRow>
            <SettingRow label="Timezone" description="Used for all mission timestamps">
              <select className="select-input">
                <option>UTC</option>
                <option>UTC-5 (EST)</option>
                <option>UTC-8 (PST)</option>
                <option>UTC+1 (CET)</option>
              </select>
            </SettingRow>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Notifications</div>
          <div className="setting-list">
            <SettingRow label="Critical Alerts" description="Receive notifications for critical system events">
              <Toggle defaultChecked />
            </SettingRow>
            <SettingRow label="Warnings" description="Receive notifications for warnings">
              <Toggle defaultChecked />
            </SettingRow>
            <SettingRow label="Mission Updates" description="Notify on mission state changes">
              <Toggle />
            </SettingRow>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Fleet Defaults</div>
          <div className="setting-list">
            <SettingRow label="Low Battery Threshold" description="Alert when unit battery falls below this level">
              <input className="text-input text-input--short" type="number" defaultValue={20} min={5} max={50} />
            </SettingRow>
            <SettingRow label="Auto-recall on Low Battery" description="Automatically recall units when battery is critical">
              <Toggle defaultChecked />
            </SettingRow>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
