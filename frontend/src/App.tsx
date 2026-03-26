import { useState, type CSSProperties } from "react";
import { verifyAdminKey } from "./services/admin";
import ServiceOrdersPage from "./pages/ServiceOrdersPage";
import ServiceOrderDetailPage from "./pages/ServiceOrderDetailPage";

export default function App() {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminInput, setAdminInput] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function handleAdminLogin() {
    if (!adminInput.trim()) return;
    try {
      setVerifying(true);
      setAdminError(null);
      await verifyAdminKey(adminInput.trim());
      setAdminKey(adminInput.trim());
      setIsAdmin(true);
      setAdminInput("");
    } catch {
      setAdminError("Clave incorrecta o no configurada");
    } finally {
      setVerifying(false);
    }
  }

  function handleAdminLogout() {
    setIsAdmin(false);
    setAdminKey("");
  }

  const bar = (
    <AdminBar
      isAdmin={isAdmin}
      adminInput={adminInput}
      setAdminInput={setAdminInput}
      adminError={adminError}
      verifying={verifying}
      onLogin={handleAdminLogin}
      onLogout={handleAdminLogout}
    />
  );

  if (selectedOrderId !== null) {
    return (
      <>
        {bar}
        <ServiceOrderDetailPage
          orderId={selectedOrderId}
          onBack={() => setSelectedOrderId(null)}
          isAdmin={isAdmin}
          adminKey={adminKey}
        />
      </>
    );
  }

  return (
    <>
      {bar}
      <ServiceOrdersPage onSelectOrder={setSelectedOrderId} isAdmin={isAdmin} />
    </>
  );
}

type AdminBarProps = {
  isAdmin: boolean;
  adminInput: string;
  setAdminInput: (v: string) => void;
  adminError: string | null;
  verifying: boolean;
  onLogin: () => void;
  onLogout: () => void;
};

function AdminBar({ isAdmin, adminInput, setAdminInput, adminError, verifying, onLogin, onLogout }: AdminBarProps) {
  return (
    <div style={barStyle}>
      {isAdmin ? (
        <>
          <span style={{ color: "#86efac", fontSize: "13px" }}>Modo admin activo</span>
          <button onClick={onLogout} style={adminBtnStyle}>Salir</button>
        </>
      ) : (
        <>
          <input
            type="password"
            value={adminInput}
            onChange={(e) => setAdminInput(e.target.value)}
            placeholder="Clave admin"
            style={{ padding: "6px 10px", borderRadius: "6px", border: "none", fontSize: "13px" }}
          />
          <button onClick={onLogin} disabled={verifying} style={adminBtnStyle}>
            {verifying ? "Verificando..." : "Entrar como admin"}
          </button>
          {adminError && <span style={{ color: "#fca5a5", fontSize: "13px" }}>{adminError}</span>}
        </>
      )}
    </div>
  );
}

const barStyle: CSSProperties = {
  padding: "8px 24px",
  background: "#111827",
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const adminBtnStyle: CSSProperties = {
  padding: "6px 12px",
  borderRadius: "6px",
  border: "1px solid #374151",
  background: "#1f2937",
  color: "white",
  cursor: "pointer",
  fontSize: "13px",
};
