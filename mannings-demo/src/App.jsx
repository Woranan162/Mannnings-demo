import { useState, useEffect, useRef } from "react";

const theme = {
  orange: "#F5A623",
  orangeDark: "#E8920A",
  orangeLight: "#FDB94A",
  black: "#0A0A0A",
  darkGray: "#141414",
  midGray: "#1E1E1E",
  borderGray: "#2A2A2A",
  textPrimary: "#F0EDE6",
  textSecondary: "#8A8580",
  critical: "#FF4444",
  important: "#F5A623",
  sufficient: "#2ECC71",
  marginal: "#F39C12",
};

const mockStores = [
  { id: 1, name: "Westwood", district: "Kennedy Town", lat: 22.281, lng: 114.128 },
  { id: 2, name: "Causeway Bay", district: "Causeway Bay", lat: 22.280, lng: 114.183 },
  { id: 3, name: "Mong Kok", district: "Mong Kok", lat: 22.319, lng: 114.169 },
  { id: 4, name: "Tsim Sha Tsui", district: "TST", lat: 22.298, lng: 114.172 },
  { id: 5, name: "Tuen Mun", district: "Tuen Mun", lat: 22.391, lng: 113.977 },
];

const mockSKUs = [
  { id: "SKU-4521", name: "Moisturizer (Dermacept)", current: 1050, transfer: 2700, forecast: 1245, cover: 2, status: "SUFFICIENT", category: "Skincare" },
  { id: "SKU-3302", name: "Serum (Vitamin C)", current: 275, transfer: 1300, forecast: 687, cover: 0.4, status: "CRITICAL", category: "Skincare" },
  { id: "SKU-7841", name: "Shampoo (Head & Shoulders)", current: 520, transfer: 800, forecast: 430, cover: 1.2, status: "MARGINAL", category: "Hair" },
  { id: "SKU-2291", name: "Baby Wipes (Huggies)", current: 3200, transfer: 0, forecast: 290, cover: 11, status: "SUFFICIENT", category: "Mom & Baby" },
  { id: "SKU-6610", name: "Sunscreen SPF50+", current: 140, transfer: 600, forecast: 380, cover: 0.37, status: "CRITICAL", category: "Skincare" },
  { id: "SKU-9923", name: "Lip Balm (Vaseline)", current: 880, transfer: 200, forecast: 310, cover: 2.8, status: "SUFFICIENT", category: "Beauty" },
];

const mockFleet = [
  { id: "T-01", status: "EN_ROUTE", store: "Westwood", eta: "10:45 AM", progress: 65, stops: ["ECDC", "Westwood", "Kennedy Town"] },
  { id: "T-02", status: "DELAYED", store: "Causeway Bay", eta: "11:30 AM", progress: 30, stops: ["ECDC", "Causeway Bay", "Wan Chai"] },
  { id: "T-03", status: "LOADING", store: "Mong Kok", eta: "12:15 PM", progress: 10, stops: ["ECDC", "Mong Kok", "Yau Ma Tei"] },
  { id: "T-04", status: "DELIVERED", store: "TST", eta: "Done", progress: 100, stops: ["ECDC", "TST"] },
];

// ─── Animated Counter ───────────────────────────────────────────────
function AnimatedNumber({ value, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
  let start = 0;
  const end = parseInt(value);
  const duration = 800;
  const step = end / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= end) { setDisplay(end); clearInterval(timer); }
    else setDisplay(Math.floor(start));
  }, 16);
  return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

// ─── Status Badge ────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    CRITICAL: { bg: "#FF444420", border: "#FF4444", text: "#FF6666" },
    MARGINAL: { bg: "#F5A62320", border: "#F5A623", text: "#F5A623" },
    SUFFICIENT: { bg: "#2ECC7120", border: "#2ECC71", text: "#2ECC71" },
    EN_ROUTE: { bg: "#4A90D920", border: "#4A90D9", text: "#6AABF7" },
    DELAYED: { bg: "#FF444420", border: "#FF4444", text: "#FF6666" },
    LOADING: { bg: "#F5A62320", border: "#F5A623", text: "#F5A623" },
    DELIVERED: { bg: "#2ECC7120", border: "#2ECC71", text: "#2ECC71" },
    HIGH: { bg: "#2ECC7120", border: "#2ECC71", text: "#2ECC71" },
    MEDIUM: { bg: "#F5A62320", border: "#F5A623", text: "#F5A623" },
    LOW: { bg: "#FF444420", border: "#FF4444", text: "#FF6666" },
  };
  const c = colors[status] || colors.SUFFICIENT;
  return (
    <span style={{
    background: c.bg, border: `1px solid ${c.border}`, color: c.text,
    borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700,
    letterSpacing: "0.08em", fontFamily: "monospace"
    }}>{status}</span>
  );
}

// ─── Mini Progress Bar ───────────────────────────────────────────────
function ProgressBar({ value, max = 100, color = theme.orange }) {
  return (
  <div style={{ background: "#2A2A2A", borderRadius: 4, height: 4, overflow: "hidden", width: "100%" }}>
    <div style={{
    width: `${Math.min(100, (value / max) * 100)}%`,
    height: "100%", background: color,
    borderRadius: 4, transition: "width 1s ease"
    }} />
  </div>
  );
}

// ─── PANEL 1: Pickup Promise ─────────────────────────────────────────
function PickupPromisePanel() {
const [store, setStore] = useState("Westwood");
const [items, setItems] = useState("SKU-4521, SKU-3302");
const [result, setResult] = useState(null);
const [loading, setLoading] = useState(false);
const [aiMessage, setAiMessage] = useState("");
const [aiLoading, setAiLoading] = useState(false);

const calculatePromise = () => {
setLoading(true);
setResult(null);
setAiMessage("");
setTimeout(() => {
const skuList = items.split(",").map(s => s.trim());
const hasCritical = skuList.some(s => s === "SKU-3302" || s === "SKU-6610");
const confidence = hasCritical ? "MEDIUM" : "HIGH";
const minutesAdd = hasCritical ? 75 : 45;
const now = new Date();
now.setMinutes(now.getMinutes() + minutesAdd);
const rounded = new Date(Math.ceil(now.getTime() / (15 * 60000)) * (15 * 60000));
const timeStr = rounded.toLocaleTimeString("en-HK", { hour: "2-digit", minute: "2-digit" });
setResult({ time: timeStr, confidence, store, hasCritical, skus: skuList });
setLoading(false);
if (hasCritical) generateAINotification(timeStr, store);
}, 1200);
};

const generateAINotification = async (time, storeName) => {
setAiLoading(true);
try {
const response = await fetch("https://api.anthropic.com/v1/messages", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
model: "claude-sonnet-4-20250514",
max_tokens: 1000,
system: "You are a customer notification writer for Mannings pharmacy in Hong Kong. Write short, friendly, professional SMS notifications in 2-3 sentences. Include specific time and a small apology offer.",
messages: [{
role: "user",
content: `Write a customer SMS notification: order at ${storeName} Mannings is slightly delayed due to stock replenishment. New pickup time: ${time}. Include a 30 HKD reward points offer as apology.`
}]
})
});
const data = await response.json();
setAiMessage(data.content?.[0]?.text || "");
} catch (e) {
setAiMessage("Hi! Your Mannings order at " + storeName + " is ready for pickup at " + time + ". We've added 30 HKD reward points to your account as a thank-you for your patience. 🧡");
}
setAiLoading(false);
};

return (
<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
<div>
<label style={{ fontSize: 10, color: theme.textSecondary, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Store</label>
<select value={store} onChange={e => setStore(e.target.value)} style={{
width: "100%", background: theme.midGray, border: `1px solid ${theme.borderGray}`,
color: theme.textPrimary, padding: "10px 12px", borderRadius: 8, fontSize: 13, outline: "none"
}}>
{mockStores.map(s => <option key={s.id}>{s.name}</option>)}
</select>
</div>
<div>
<label style={{ fontSize: 10, color: theme.textSecondary, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>SKU IDs</label>
<input value={items} onChange={e => setItems(e.target.value)} placeholder="SKU-4521, SKU-3302"
style={{
width: "100%", background: theme.midGray, border: `1px solid ${theme.borderGray}`,
color: theme.textPrimary, padding: "10px 12px", borderRadius: 8, fontSize: 13,
outline: "none", boxSizing: "border-box"
}} />
</div>
</div>


  <button onClick={calculatePromise} disabled={loading} style={{
    background: loading ? theme.borderGray : theme.orange,
    color: loading ? theme.textSecondary : theme.black,
    border: "none", borderRadius: 8, padding: "12px 24px",
    fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
    letterSpacing: "0.05em", transition: "all 0.2s"
  }}>
    {loading ? "⏳ Calculating..." : "⚡ Get Pickup Promise"}
  </button>

  {result && (
    <div style={{
      background: theme.midGray, border: `1px solid ${theme.borderGray}`,
      borderRadius: 12, padding: 20, animation: "fadeIn 0.4s ease"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 4 }}>READY AT</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: theme.orange, fontFamily: "monospace" }}>{result.time}</div>
        </div>
        <StatusBadge status={result.confidence} />
      </div>
      <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8 }}>
        📍 {result.store} Mannings &nbsp;·&nbsp; {result.skus.length} item{result.skus.length > 1 ? "s" : ""}
      </div>
      {result.hasCritical && (
        <div style={{ fontSize: 11, color: "#F5A623", background: "#F5A62310", borderRadius: 6, padding: "6px 10px" }}>
          ⚠️ 1 SKU requires ECDC replenishment — buffer time added
        </div>
      )}
    </div>
  )}

  {(aiLoading || aiMessage) && (
    <div style={{
      background: "#0D1F1A", border: "1px solid #2ECC7140",
      borderRadius: 12, padding: 16
    }}>
      <div style={{ fontSize: 10, color: "#2ECC71", letterSpacing: "0.1em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 14 }}>✦</span> CLAUDE AI — AUTO-GENERATED CUSTOMER NOTIFICATION
      </div>
      {aiLoading
        ? <div style={{ fontSize: 12, color: theme.textSecondary }}>Generating message...</div>
        : <div style={{ fontSize: 13, color: theme.textPrimary, lineHeight: 1.6 }}>{aiMessage}</div>
      }
    </div>
  )}
</div>


);
}

// ─── PANEL 2: Fleet Management ───────────────────────────────────────
function FleetPanel() {
const [selected, setSelected] = useState(null);
const [tick, setTick] = useState(0);

useEffect(() => {
const interval = setInterval(() => setTick(t => t + 1), 3000);
return () => clearInterval(interval);
}, []);

const statusColor = { EN_ROUTE: "#4A90D9", DELAYED: "#FF4444", LOADING: "#F5A623", DELIVERED: "#2ECC71" };

return (
<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
{mockFleet.map(truck => (
<div key={truck.id} onClick={() => setSelected(selected?.id === truck.id ? null : truck)}
style={{
background: selected?.id === truck.id ? "#1A1A1A" : theme.midGray,
border: `1px solid ${selected?.id === truck.id ? theme.orange : theme.borderGray}`,
borderRadius: 10, padding: "12px 16px", cursor: "pointer",
transition: "all 0.2s"
}}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
<span style={{ fontSize: 18 }}>🚚</span>
<div>
<div style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>Truck {truck.id}</div>
<div style={{ fontSize: 11, color: theme.textSecondary }}>→ {truck.store}</div>
</div>
</div>
<div style={{ textAlign: "right" }}>
<StatusBadge status={truck.status} />
<div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>ETA: {truck.eta}</div>
</div>
</div>
<ProgressBar value={truck.progress} color={statusColor[truck.status]} />
{selected?.id === truck.id && (
<div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.borderGray}` }}>
<div style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 8, letterSpacing: "0.1em" }}>ROUTE</div>
<div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
{truck.stops.map((stop, i) => (
<span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
<span style={{
background: i === 0 ? theme.orange : i === truck.stops.length - 1 ? "#2ECC71" : theme.borderGray,
color: i === 0 || i === truck.stops.length - 1 ? theme.black : theme.textSecondary,
borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600
}}>{stop}</span>
{i < truck.stops.length - 1 && <span style={{ color: theme.textSecondary, fontSize: 10 }}>→</span>}
</span>
))}
</div>
{truck.status === "DELAYED" && (
<div style={{ marginTop: 10, background: "#FF444415", border: "1px solid #FF444440", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#FF8888" }}>
⚠️ Traffic delay detected on Gloucester Rd. Rerouting via Hennessy Rd — ETA updated.
</div>
)}
</div>
)}
</div>
))}


  <div style={{ background: theme.midGray, borderRadius: 10, padding: 16, border: `1px solid ${theme.borderGray}` }}>
    <div style={{ fontSize: 10, color: theme.textSecondary, letterSpacing: "0.1em", marginBottom: 12 }}>FLEET SUMMARY</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
      {[
        { label: "Active", value: 2, color: "#4A90D9" },
        { label: "Delayed", value: 1, color: "#FF4444" },
        { label: "Loading", value: 1, color: "#F5A623" },
        { label: "Done", value: 1, color: "#2ECC71" },
      ].map(item => (
        <div key={item.label} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: item.color, fontFamily: "monospace" }}>{item.value}</div>
          <div style={{ fontSize: 10, color: theme.textSecondary }}>{item.label}</div>
        </div>
      ))}
    </div>
  </div>
</div>


);
}

// ─── PANEL 3: Replenishment / Inventory ─────────────────────────────
function ReplenishmentPanel() {
const [filter, setFilter] = useState("ALL");
const categories = ["ALL", "Skincare", "Hair", "Mom & Baby", "Beauty"];
const filtered = filter === "ALL" ? mockSKUs : mockSKUs.filter(s => s.category === filter);
const statusColor = { CRITICAL: theme.critical, MARGINAL: theme.marginal, SUFFICIENT: theme.sufficient };

return (
<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{categories.map(c => (
<button key={c} onClick={() => setFilter(c)} style={{
background: filter === c ? theme.orange : theme.midGray,
color: filter === c ? theme.black : theme.textSecondary,
border: `1px solid ${filter === c ? theme.orange : theme.borderGray}`,
borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600,
cursor: "pointer", transition: "all 0.15s"
}}>{c}</button>
))}
</div>


  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {filtered.map(sku => (
      <div key={sku.id} style={{
        background: theme.midGray, border: `1px solid ${sku.status === "CRITICAL" ? "#FF444430" : theme.borderGray}`,
        borderRadius: 10, padding: "12px 16px",
        borderLeft: `3px solid ${statusColor[sku.status]}`
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>{sku.name}</div>
            <div style={{ fontSize: 10, color: theme.textSecondary, fontFamily: "monospace" }}>{sku.id} · {sku.category}</div>
          </div>
          <StatusBadge status={sku.status} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 8 }}>
          {[
            { label: "Current Stock", value: sku.current.toLocaleString() },
            { label: "Transfer Tonight", value: sku.transfer > 0 ? `+${sku.transfer.toLocaleString()}` : "—", highlight: sku.transfer > 0 },
            { label: "Cover Days", value: `${sku.cover}d`, alert: sku.cover < 1 },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: 10, color: theme.textSecondary }}>{item.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: item.alert ? theme.critical : item.highlight ? theme.orange : theme.textPrimary }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: theme.textSecondary }}>Stock vs Forecast</span>
            <span style={{ fontSize: 10, color: theme.textSecondary }}>{sku.forecast.toLocaleString()} forecasted</span>
          </div>
          <ProgressBar value={sku.current} max={Math.max(sku.current, sku.forecast) * 1.2}
            color={sku.status === "CRITICAL" ? theme.critical : sku.status === "MARGINAL" ? theme.marginal : theme.sufficient} />
        </div>
      </div>
    ))}
  </div>
</div>

);
}

// ─── MAIN APP ────────────────────────────────────────────────────────
export default function App() {
const [activeTab, setActiveTab] = useState("promise");
const [time, setTime] = useState(new Date());

useEffect(() => {
const t = setInterval(() => setTime(new Date()), 1000);
return () => clearInterval(t);
}, []);

const tabs = [
{ id: "promise", label: "Pickup Promise", icon: "🤝" },
{ id: "fleet", label: "Fleet Management", icon: "🚚" },
{ id: "inventory", label: "Replenishment", icon: "📦" },
];

const stats = [
{ label: "On-Time Rate", value: "94.2", suffix: "%", color: theme.sufficient },
{ label: "Active Trucks", value: "3", suffix: "", color: theme.orange },
{ label: "Critical SKUs", value: "2", suffix: "", color: theme.critical },
{ label: "Orders Today", value: "1847", suffix: "", color: "#4A90D9" },
];

return (
<div style={{
minHeight: "100vh", background: theme.black, color: theme.textPrimary,
fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
padding: 0
}}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #141414; } ::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 2px; } @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } } select option { background: #1E1E1E; }`}</style>

  {/* Header */}
  <div style={{
    background: theme.darkGray, borderBottom: `1px solid ${theme.borderGray}`,
    padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
    height: 56
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        background: theme.orange, color: theme.black, padding: "4px 10px",
        borderRadius: 6, fontSize: 12, fontWeight: 800, letterSpacing: "0.05em"
      }}>萬寧</div>
      <span style={{ color: theme.textSecondary, fontSize: 11 }}>/</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>Operations Intelligence</span>
      <span style={{
        background: "#2ECC7120", border: "1px solid #2ECC7140", color: "#2ECC71",
        borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 600,
        animation: "pulse 2s infinite"
      }}>● LIVE</span>
    </div>
    <div style={{ fontSize: 12, color: theme.textSecondary, fontFamily: "monospace" }}>
      {time.toLocaleTimeString("en-HK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      &nbsp;·&nbsp; HKT
    </div>
  </div>

  <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>

    {/* KPI Row */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: theme.darkGray, border: `1px solid ${theme.borderGray}`,
          borderRadius: 12, padding: "16px 20px"
        }}>
          <div style={{ fontSize: 10, color: theme.textSecondary, letterSpacing: "0.1em", marginBottom: 6 }}>{s.label.toUpperCase()}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "monospace" }}>
            <AnimatedNumber value={s.value.replace("%", "").replace(",", "")} suffix={s.suffix} />
          </div>
        </div>
      ))}
    </div>

    {/* Tabs */}
    <div style={{
      display: "flex", gap: 0, marginBottom: 20,
      background: theme.darkGray, borderRadius: 10, padding: 4,
      border: `1px solid ${theme.borderGray}`
    }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
          flex: 1, background: activeTab === tab.id ? theme.orange : "transparent",
          color: activeTab === tab.id ? theme.black : theme.textSecondary,
          border: "none", borderRadius: 7, padding: "10px 16px",
          fontSize: 12, fontWeight: 700, cursor: "pointer",
          transition: "all 0.2s", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6
        }}>
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>

    {/* Panel */}
    <div style={{
      background: theme.darkGray, border: `1px solid ${theme.borderGray}`,
      borderRadius: 16, padding: 24, animation: "fadeIn 0.3s ease"
    }}>
      {activeTab === "promise" && <PickupPromisePanel />}
      {activeTab === "fleet" && <FleetPanel />}
      {activeTab === "inventory" && <ReplenishmentPanel />}
    </div>

    {/* Footer */}
    <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: theme.borderGray }}>
      DIRTY WORK · DFI Retail Group – Mannings · Technology & Business Innovation · 2026
    </div>
  </div>
</div>


);
}