import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  MapPin as MapPinIcon,
  CheckCircle as CheckCircleIcon,
  Trash2 as Trash2Icon,
  RefreshCcw as RefreshCcwIcon,
  Download as DownloadIcon,
  ThumbsUp as ThumbsUpIcon,
  LogIn as LogInIcon,
  LogOut as LogOutIcon,
  User as UserIcon,
  Shield as ShieldIcon,
  Filter as FilterIcon,
  Bell as BellIcon,
  Check as ApproveIcon,
  X as RejectIcon,
  Map as MapIcon,
  BarChart3 as ChartIcon,
  Plus as PlusIcon,
  Bookmark as BookmarkIcon,
  Globe as GlobeIcon,
  Clock as ClockIcon,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const Icon = ({ children }) => (
  <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:16, height:16, marginRight:8 }}>
    {children}
  </span>
);

const DefaultIcon = L.icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapClickSetter({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const uid = () => Math.floor(Math.random() * 1e9).toString(36) + Date.now().toString(36);
const now = () => Date.now();
const formatTs = (ts) => (ts ? new Date(ts).toLocaleString() : "—");

function useDeviceId() {
  const [deviceId, setDeviceId] = useState(null);
  useEffect(() => {
    let id = localStorage.getItem("stadtmeldung_device_id");
    if (!id) {
      id = uid();
      localStorage.setItem("stadtmeldung_device_id", id);
    }
    setDeviceId(id);
  }, []);
  return deviceId;
}

const DEMO_GEOCODER = {
  mitte: { lat: 52.520008, lng: 13.404954, area: "Mitte", zip: "10115" },
  kreuzberg: { lat: 52.4986, lng: 13.4033, area: "Kreuzberg", zip: "10997" },
  "prenzlauer berg": { lat: 52.539, lng: 13.424, area: "Prenzlauer Berg", zip: "10405" },
  charlottenburg: { lat: 52.5046, lng: 13.2907, area: "Charlottenburg", zip: "10623" },
  neukölln: { lat: 52.48, lng: 13.4376, area: "Neukölln", zip: "12043" },
  friedrichshain: { lat: 52.5155, lng: 13.4546, area: "Friedrichshain", zip: "10245" },
};

const CATEGORIES = [
  { value: "müll", label: "Müll" },
  { value: "schlagloch", label: "Schlagloch" },
  { value: "licht", label: "Defekte Beleuchtung" },
  { value: "baum", label: "Umgestürzter Baum" },
  { value: "ast", label: "Großer Ast" },
  { value: "graffiti", label: "Graffiti/Vandalismus" },
  { value: "wasser", label: "Wasserrohrbruch/Leck" },
  { value: "verkehr", label: "Defektes Verkehrsschild" },
  { value: "spielplatz", label: "Spielplatz-Schaden" },
  { value: "laerm", label: "Lärm/Belästigung" },
  { value: "verschmutzung", label: "Verschmutzung" },
  { value: "wildparken", label: "Wildparken" },
  { value: "anderes", label: "Anderes" },
];

export default function StadtMeldung() {
  const deviceId = useDeviceId();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("stadtmeldung_user");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  useEffect(() => {
    try {
      if (currentUser) localStorage.setItem("stadtmeldung_user", JSON.stringify(currentUser));
      else localStorage.removeItem("stadtmeldung_user");
    } catch (e) {}
  }, [currentUser]);

  const [adminMode, setAdminMode] = useState(false);
  useEffect(() => {
    if (!currentUser?.isAdmin && !currentUser?.isModerator) setAdminMode(false);
  }, [currentUser]);

  const [subscriptions, setSubscriptions] = useState(() => {
    try {
      const saved = localStorage.getItem("stadtmeldung_subs");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  useEffect(() => {
    try { localStorage.setItem("stadtmeldung_subs", JSON.stringify(subscriptions)); } catch (e) {}
  }, [subscriptions]);

  const [notifyOnStatus, setNotifyOnStatus] = useState(() => {
    try { return JSON.parse(localStorage.getItem("stadtmeldung_notify_status") || "false"); } catch { return false; }
  });
  useEffect(() => { try { localStorage.setItem("stadtmeldung_notify_status", JSON.stringify(notifyOnStatus)); } catch (e) {} }, [notifyOnStatus]);

  const [useLiveGeocode, setUseLiveGeocode] = useState(() => {
    try { return JSON.parse(localStorage.getItem("stadtmeldung_live_geocode") || "false"); } catch { return false; }
  });
  useEffect(() => { try { localStorage.setItem("stadtmeldung_live_geocode", JSON.stringify(useLiveGeocode)); } catch (e) {} }, [useLiveGeocode]);

  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem("stadtmeldung_reports");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const created = now() - 1000 * 60 * 60 * 24;
    return [
      {
        id: 1, category: "müll", description: "Testmeldung: Müll auf dem Gehweg",
        image: null, location: { lat: 52.52, lng: 13.405, area: "Mitte", zip: "10115" },
        status: "gemeldet", reporterId: null, votes: { count: 2, voters: ["seed-a","seed-b"] },
        approved: true, createdAt: created, statusHistory:[{status:"gemeldet", at: created}],
      },
      { id: 2, category: "schlagloch", description: "Test: Schlagloch nahe Brandenburger Tor",
        image: null, location: { lat: 52.5163, lng: 13.3777, area: "Mitte", zip: "10117" },
        status: "angenommen", reporterId: null, votes: { count: 1, voters: ["seed-c"] },
        approved: true, createdAt: created - 3600000,
        statusHistory:[{status:"gemeldet", at: created - 3600000},{status:"angenommen", at: created - 1800000}],
      },
      { id: 3, category: "licht", description: "Test: Laterne vor Hausnummer 12 defekt",
        image: null, location: { lat: 52.4986, lng: 13.4033, area: "Kreuzberg", zip: "10997" },
        status: "erledigt", reporterId: null, votes: { count: 0, voters: [] },
        approved: true, createdAt: created - 7200000,
        statusHistory:[{status:"gemeldet", at: created - 7200000},{status:"angenommen", at: created - 5400000},{status:"erledigt", at: created - 600000}],
      },
      { id: 4, category: "baum", description: "Test: Umgestürzter Baum blockiert Radweg",
        image: null, location: { lat: 52.49, lng: 13.32, area: "Charlottenburg", zip: "10623" },
        status: "gemeldet", reporterId: null, votes: { count: 4, voters: ["seed-a","seed-d","seed-e","seed-f"] },
        approved: true, createdAt: created - 2700000, statusHistory:[{status:"gemeldet", at: created - 2700000}],
      },
      { id: 5, category: "verschmutzung", description: "Test: Ölspur auf der Straße",
        image: null, location: { lat: 52.50, lng: 13.45, area: "Friedrichshain", zip: "10245" },
        status: "gemeldet", reporterId: null, votes: { count: 0, voters: [] },
        approved: false, createdAt: created, statusHistory:[{status:"gemeldet", at: created}],
      },
    ];
  });

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [anonymous, setAnonymous] = useState(true);
  const [address, setAddress] = useState("");
  const [areaFilter, setAreaFilter] = useState("alle");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [categoryFilter, setCategoryFilter] = useState("alle");
  const [sortBy, setSortBy] = useState("neueste");
  const [onlyMine, setOnlyMine] = useState(false);
  const [showUnapproved, setShowUnapproved] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("stadtmeldung_reports", JSON.stringify(reports)); } catch (e) {}
  }, [reports]);

  const handleImageChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return setImage(null);
    const url = URL.createObjectURL(file);
    setImage(url);
  };

  const notify = (title, body) => {
    try {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") new Notification(title, { body });
    } catch (e) {}
  };

  const handleSubmit = () => {
    if (!category) return alert("Bitte Kategorie wählen");
    if (!description.trim()) return alert("Bitte Beschreibung eingeben");
    if (!location) return alert("Bitte einen Standort setzen (Karte klicken, Button oder Geocoding)");

    const reporterId = anonymous ? null : currentUser?.id || deviceId;
    const newReport = {
      id: Date.now(),
      category, description, image, location,
      status: "gemeldet",
      reporterId: reporterId || null,
      votes: { count: 0, voters: [] },
      approved: false,
      createdAt: now(),
      statusHistory: [{ status: "gemeldet", at: now() }],
    };
    setReports((prev) => [newReport, ...prev]);

    const area = newReport.location?.area?.toLowerCase();
    const zip = newReport.location?.zip;
    const hit = subscriptions.find((s) => s.type === "area" && s.value.toLowerCase() === (area || "")) ||
                subscriptions.find((s) => s.type === "zip" && s.value === zip);
    if (hit) notify("Neue Meldung", `${newReport.category} in ${newReport.location?.area || "deiner Region"}`);

    setCategory(""); setDescription(""); setImage(null); setLocation(null); setAddress("");
  };

  const handleSetDummyLocation = () => setLocation({ lat: 52.52, lng: 13.405, area: "Mitte", zip: "10115" });

  const liveGeocode = async (q) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=1`;
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      const data = await res.json();
      const hit = data?.[0];
      if (!hit) return null;
      const lat = parseFloat(hit.lat);
      const lng = parseFloat(hit.lon);
      const addr = hit.address || {};
      const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.city || "";
      const zip = addr.postcode || "";
      return { lat, lng, area, zip };
    } catch (e) {
      console.warn("Geocoding failed", e);
      return null;
    }
  };

  const handleGeocode = async () => {
    const q = (address || "").trim();
    if (!q) return;
    if (useLiveGeocode) {
      const loc = await liveGeocode(q);
      if (loc) setLocation(loc);
      else alert("Adresse nicht gefunden (Live-Geocoder)");
    } else {
      const key = q.toLowerCase();
      const hit = DEMO_GEOCODER[key];
      if (hit) setLocation(hit);
      else alert("Adresse/Stadtteil (Demo) nicht gefunden. Beispiele: Mitte, Kreuzberg, Prenzlauer Berg, Charlottenburg, Neukölln, Friedrichshain");
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Meldung wirklich löschen?")) {
      setReports((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleStatusChange = (id) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const canChange = currentUser?.isAdmin || currentUser?.isModerator || (currentUser && r.reporterId && r.reporterId === currentUser.id);
        if (!canChange) return r;
        const prevStatus = r.status;
        const next = r.status === "gemeldet" ? "angenommen" : r.status === "angenommen" ? "erledigt" : "gemeldet";
        const updated = { ...r, status: next, statusHistory: [...(r.statusHistory || []), { status: next, at: now() }] };
        if (currentUser && r.reporterId && r.reporterId === currentUser.id) {
          notify("Status aktualisiert", `Deine Meldung #${r.id} ist jetzt '${next}'.`);
        }
        if (notifyOnStatus) {
          const area = r.location?.area?.toLowerCase();
          const zip = r.location?.zip;
          const hit = subscriptions.find((s) => s.type === "area" && s.value.toLowerCase() === (area || "")) ||
                      subscriptions.find((s) => s.type === "zip" && s.value === zip);
          if (hit) notify("Status geändert", `#${r.id}: ${prevStatus} → ${next} (${r.location?.area || ""})`);
        }
        return updated;
      })
    );
  };

  const handleVote = (id) => {
    const voter = currentUser?.id || deviceId;
    if (!voter) return alert("Voting derzeit nicht möglich – kein Nutzer/Device erkannt.");
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const already = r.votes?.voters?.includes(voter);
        if (already) return r;
        const votes = { count: (r.votes?.count || 0) + 1, voters: [...(r.votes?.voters || []), voter] };
        return { ...r, votes };
      })
    );
  };

  const approveReport = (id) => {
    if (!(currentUser?.isAdmin || currentUser?.isModerator)) return alert("Nur Admin/Moderator.");
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, approved: true } : r)));
  };
  const rejectReport = (id) => {
    if (!(currentUser?.isAdmin || currentUser?.isModerator)) return alert("Nur Admin/Moderator.");
    if (window.confirm("Ungeprüfte Meldung löschen?")) {
      setReports((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const exportCSV = () => {
    if (!currentUser?.isAdmin) return alert("Nur Admins können exportieren.");
    const getAt = (hist, key) => hist?.find((h) => h.status === key)?.at || "";
    const headers = [
      "id","category","description","status","approved","createdAt","acceptedAt","doneAt","lat","lng","area","zip","votes","reporterId"
    ];
    const rows = reports.map((r) => [
      r.id, r.category, (r.description || "").replace(/\n/g, " ").replace(/"/g, "'"),
      r.status, r.approved ? 1 : 0, r.createdAt || "",
      getAt(r.statusHistory, "angenommen"), getAt(r.statusHistory, "erledigt"),
      r.location?.lat ?? "", r.location?.lng ?? "", r.location?.area ?? "", r.location?.zip ?? "",
      r.votes?.count ?? 0, r.reporterId ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stadtmeldung_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mapCenter = location ? [location.lat, location.lng] : [52.52, 13.405];

  const normalized = (s) => (s || "").toLowerCase();
  let derived = reports
    .filter((r) => (adminMode ? true : r.approved))
    .filter((r) => (showUnapproved ? true : r.approved || !adminMode))
    .filter((r) => (statusFilter === "alle" ? true : r.status === statusFilter))
    .filter((r) => (categoryFilter === "alle" ? true : r.category === categoryFilter))
    .filter((r) => (areaFilter === "alle" ? true : (r.location?.area || "").toLowerCase() === areaFilter.toLowerCase()))
    .filter((r) => {
      const q = normalized(query);
      if (!q) return true;
      return (
        normalized(r.category).includes(q) ||
        normalized(r.description).includes(q) ||
        (r.location && `${r.location.lat},${r.location.lng}`.includes(q)) ||
        normalized(r.location?.area || "").includes(q) ||
        (r.location?.zip || "").includes(q)
      );
    });
  if (onlyMine && currentUser) {
    derived = derived.filter((r) => r.reporterId && r.reporterId === currentUser.id);
  }
  const filteredReports = derived.sort((a, b) => (sortBy === "neueste" ? b.id - a.id : a.id - b.id));

  const counts = useMemo(() => ({
    total: reports.length,
    approved: reports.filter((r) => r.approved).length,
    unapproved: reports.filter((r) => !r.approved).length,
    gemeldet: reports.filter((r) => r.status === "gemeldet").length,
    angenommen: reports.filter((r) => r.status === "angenommen").length,
    erledigt: reports.filter((r) => r.status === "erledigt").length,
    votes: reports.reduce((acc, r) => acc + (r.votes?.count || 0), 0),
  }), [reports]);

  const kpis = useMemo(() => {
    const toAccepted = [];
    const toDone = [];
    const nowTs = now();
    const isInLast = (ms) => (ts) => ts && nowTs - ts <= ms;
    let last7 = 0, last30 = 0;
    const perDay = {};
    for (const r of reports) {
      const hist = r.statusHistory || [];
      const created = hist.find((h) => h.status === "gemeldet")?.at;
      const accepted = hist.find((h) => h.status === "angenommen")?.at;
      const done = hist.find((h) => h.status === "erledigt")?.at;
      if (created && accepted) toAccepted.push((accepted - created) / 60000);
      if (created && done) toDone.push((done - created) / 60000);
      if (isInLast(7*24*60*60*1000)(created)) last7++;
      if (isInLast(30*24*60*60*1000)(created)) last30++;
      if (created) {
        const d = new Date(created).toISOString().slice(0,10);
        perDay[d] = (perDay[d] || 0) + 1;
      }
    }
    const avg = (arr) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0);
    const topArea = Object.entries(
      reports.reduce((m, r) => ((m[r.location?.area || "Unbekannt"] = (m[r.location?.area || "Unbekannt"] || 0) + 1), m), {})
    ).sort((a, b) => b[1] - a[1])[0]?.[0];

    const trendData = Object.entries(perDay).sort((a,b)=>a[0]<b[0]?-1:1).map(([date,count])=>({date,count}));
    const byCategory = Object.entries(reports.reduce((m,r)=>((m[r.category]=(m[r.category]||0)+1),m),{})).map(([category,count])=>({category,count}));
    const byStatus = Object.entries(reports.reduce((m,r)=>((m[r.status]=(m[r.status]||0)+1),m),{})).map(([status,count])=>({status,count}));

    return {
      avgToAcceptedMin: avg(toAccepted),
      avgToDoneMin: avg(toDone),
      topArea: topArea || "—",
      createdLast7: last7,
      createdLast30: last30,
      trendData, byCategory, byStatus,
    };
  }, [reports]);

  const [subInput, setSubInput] = useState("");
  const addSubscription = (type) => {
    const value = (subInput || "").trim();
    if (!value) return;
    const key = type === "area" ? value.toLowerCase() : value;
    if (subscriptions.some((s) => s.type === type && s.value.toLowerCase() === key.toLowerCase())) return;
    setSubscriptions((prev) => [...prev, { type, value }]);
    setSubInput("");
  };
  const removeSubscription = (idx) => setSubscriptions((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="container grid" style={{gap:24}}>
      <header style={{display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:12}}>
        <div>
          <h1 style={{fontSize:28, margin:0, color:'#2563eb'}}>StadtMeldung</h1>
          <p style={{margin:0, color:'#6b7280'}}>Melde. Verfolge. Verändere deine Stadt.</p>
        </div>

        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          {currentUser ? (
            <>
              <span className="badge"><UserIcon size={16}/> {currentUser.name} {(currentUser.isAdmin || currentUser.isModerator) && (<><ShieldIcon size={14}/> {currentUser.isAdmin? 'Admin':'Moderator'}</>)}</span>
              {(currentUser.isAdmin || currentUser.isModerator) && (
                <Button variant="outline" onClick={()=>setAdminMode(v=>!v)}><Icon><FilterIcon size={16}/></Icon>{adminMode? 'Moderation: AN':'Moderation: AUS'}</Button>
              )}
              <Button variant="secondary" onClick={()=>Notification?.requestPermission?.()}><Icon><BellIcon size={16}/></Icon>Benachrichtigungen</Button>
              <Button variant="secondary" onClick={()=>setUseLiveGeocode(v=>!v)}><Icon><GlobeIcon size={16}/></Icon>{useLiveGeocode? 'Live-Geocoder: AN':'Live-Geocoder: AUS'}</Button>
              <Button variant="secondary" onClick={()=>setCurrentUser(null)}><Icon><LogOutIcon size={16}/></Icon>Logout</Button>
              {currentUser.isAdmin && (<Button className="primary" onClick={exportCSV}><Icon><DownloadIcon size={16}/></Icon>CSV Export</Button>)}
            </>
          ) : (
            <AuthInline onLogin={(name, isAdmin, isModerator) => setCurrentUser({ id: uid(), name, isAdmin, isModerator })} />
          )}
        </div>
      </header>

      <Card className="p-4">
        <CardContent className="grid" style={{gap:16}}>
          <div className="grid grid-2" style={{gap:16}}>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Kategorie wählen" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
              </SelectContent>
            </Select>

            <Input placeholder="Suche in Beschreibung/Kategorie/Ort/PLZ..." value={query} onChange={(e)=>setQuery(e.target.value)} />
          </div>

          <Textarea placeholder="Beschreibung eingeben" value={description} onChange={(e)=>setDescription(e.target.value)} />

          <div className="grid grid-3" style={{gap:12, alignItems:'center'}}>
            <Input type="file" accept="image/*" onChange={handleImageChange} />

            <Button onClick={handleSetDummyLocation}><Icon><MapPinIcon size={16}/></Icon>Standort: Berlin Mitte</Button>

            <div style={{display:'flex', gap:8}}>
              <Input placeholder="Adresse/Stadtteil (Demo oder Live)" value={address} onChange={(e)=>setAddress(e.target.value)} />
              <Button variant="outline" onClick={handleGeocode}><Icon><MapIcon size={16}/></Icon>{useLiveGeocode? 'Geocode (Live)':'Geocode (Demo)'}</Button>
            </div>
          </div>

          <label style={{display:'flex', alignItems:'center', gap:8, fontSize:14}}>
            <input type="checkbox" checked={anonymous} onChange={(e)=>setAnonymous(e.target.checked)} /> Anonym melden
          </label>

          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
            <small style={{color:'#6b7280'}}>Gefiltert: {filteredReports.length} / {counts.total} · Geprüft: {counts.approved} · Offen: {counts.unapproved} · 7d: {kpis.createdLast7} · 30d: {kpis.createdLast30}</small>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              {currentUser && (
                <label style={{display:'flex', alignItems:'center', gap:8, fontSize:14}}>
                  <input type="checkbox" checked={onlyMine} onChange={(e)=>setOnlyMine(e.target.checked)} /> Nur meine Meldungen
                </label>
              )}
              {(currentUser?.isAdmin || currentUser?.isModerator) && (
                <label style={{display:'flex', alignItems:'center', gap:8, fontSize:14}}>
                  <input type="checkbox" checked={showUnapproved} onChange={(e)=>setShowUnapproved(e.target.checked)} /> Ungeprüfte anzeigen
                </label>
              )}

              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger><SelectValue placeholder="Stadtteil filtern" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Stadtteile</SelectItem>
                  {Object.values(DEMO_GEOCODER).map((g) => (<SelectItem key={g.area} value={g.area}>{g.area}</SelectItem>))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Status filtern" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Stati</SelectItem>
                  <SelectItem value="gemeldet">Gemeldet</SelectItem>
                  <SelectItem value="angenommen">Angenommen</SelectItem>
                  <SelectItem value="erledigt">Erledigt</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="Kategorie filtern" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Kategorien</SelectItem>
                  {CATEGORIES.map((c)=>(<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger><SelectValue placeholder="Sortierung" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="neueste">Neueste zuerst</SelectItem>
                  <SelectItem value="älteste">Älteste zuerst</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div style={{display:'flex', gap:8}}>
            <Button className="primary" onClick={handleSubmit}><Icon><CheckCircleIcon size={16}/></Icon>Meldung absenden</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="p-4">
        <CardContent className="grid" style={{gap:12}}>
          <h3 style={{margin:0, fontWeight:600, display:'flex', alignItems:'center', gap:8}}><Icon><BookmarkIcon size={16}/></Icon>Gebiets-Subscriptions (Demo)</h3>
          <div style={{display:'flex', flexWrap:'wrap', alignItems:'center', gap:12}}>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <Input placeholder="Stadtteil oder PLZ" value={subInput} onChange={(e)=>setSubInput(e.target.value)} style={{width:260}} />
              <Button variant="outline" onClick={()=>addSubscription('area')}><Icon><PlusIcon size={16}/></Icon>Stadtteil</Button>
              <Button variant="outline" onClick={()=>addSubscription('zip')}><Icon><PlusIcon size={16}/></Icon>PLZ</Button>
            </div>
            <label style={{display:'flex', alignItems:'center', gap:8, marginLeft:'auto', fontSize:14}}>
              <input type="checkbox" checked={notifyOnStatus} onChange={(e)=>setNotifyOnStatus(e.target.checked)} /> Auch bei <b>Statusänderungen</b> benachrichtigen
            </label>
          </div>
          <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
            {subscriptions.map((s,i)=>(
              <span key={`${s.type}-${s.value}-${i}`} className="badge">{s.type}: <b>{s.value}</b> <button style={{border:'none', background:'transparent', cursor:'pointer'}} onClick={()=>removeSubscription(i)}>×</button></span>
            ))}
            {subscriptions.length===0 && <span style={{fontSize:14, color:'#6b7280'}}>Keine Subscriptions hinzugefügt.</span>}
          </div>
        </CardContent>
      </Card>

      <div style={{height:380, width:'100%', overflow:'hidden', borderRadius:12}}>
        <MapContainer center={mapCenter} zoom={13} style={{height:'100%', width:'100%'}}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <MapClickSetter setLocation={setLocation} />

          {location && (
            <Marker position={[location.lat, location.lng]}>
              <Popup>Aktueller Meldungsort (klicke auf Karte, um ihn zu ändern)</Popup>
            </Marker>
          )}

          {filteredReports.map((r) => r.location ? (
            <Marker key={r.id} position={[r.location.lat, r.location.lng]}>
              <Popup>
                <strong>{r.category.toUpperCase()}</strong><br/>{r.description}
                {r.image && <><br/><img src={r.image} alt="Upload" style={{borderRadius:8, width:144, marginTop:8}}/></>}
                <br/>Status: {r.status}
                <br/>Votes: {r.votes?.count ?? 0}
                <br/>{r.approved ? "Geprüft" : "Ungeprüft"}
                <br/>Ort: {r.location?.area || "—"} · PLZ {r.location?.zip || "—"}
              </Popup>
            </Marker>
          ) : null)}
        </MapContainer>
      </div>

      {(currentUser?.isAdmin || currentUser?.isModerator) && adminMode && (
        <div className="grid" style={{gap:16}}>
          <div className="grid grid-2" style={{gap:16}}>
            <Card className="p-4">
              <CardContent className="grid" style={{gap:12}}>
                <h3 style={{margin:0, fontWeight:600, display:'flex', alignItems:'center', gap:8}}><Icon><FilterIcon size={16}/></Icon>Moderation (ungeprüft)</h3>
                {reports.filter((r)=>!r.approved).map((r)=>(
                  <div key={r.id} style={{border:'1px solid #e5e7eb', borderRadius:10, padding:12, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontWeight:600}}>#{r.id} · {r.category} · {r.location?.area || "—"} ({r.location?.zip || "—"})</div>
                      <div style={{fontSize:14, color:'#6b7280'}}>{r.description}</div>
                    </div>
                    <div style={{display:'flex', gap:8}}>
                      <Button variant="outline" onClick={()=>approveReport(r.id)}><Icon><ApproveIcon size={16}/></Icon>Freigeben</Button>
                      <Button variant="destructive" onClick={()=>rejectReport(r.id)}><Icon><RejectIcon size={16}/></Icon>Verwerfen</Button>
                    </div>
                  </div>
                ))}
                {reports.filter((r)=>!r.approved).length===0 && (<p style={{fontSize:14, color:'#6b7280'}}>Keine ungeprüften Meldungen.</p>)}
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardContent className="grid" style={{gap:12}}>
                <h3 style={{margin:0, fontWeight:600, display:'flex', alignItems:'center', gap:8}}><Icon><ChartIcon size={16}/></Icon>Kennzahlen (Demo)</h3>
                <div style={{display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:8, fontSize:14}}>
                  <div>Gesamt: <b>{counts.total}</b></div>
                  <div>Geprüft: <b>{counts.approved}</b></div>
                  <div>Ungeprüft: <b>{counts.unapproved}</b></div>
                  <div>Gemeldet: <b>{counts.gemeldet}</b></div>
                  <div>Angenommen: <b>{counts.angenommen}</b></div>
                  <div>Erledigt: <b>{counts.erledigt}</b></div>
                  <div>Summe Votes: <b>{counts.votes}</b></div>
                  <div>Top Stadtteil: <b>{kpis.topArea}</b></div>
                </div>
                <div style={{fontSize:14}}>
                  Ø bis angenommen: <b>{kpis.avgToAcceptedMin}</b> Min<br/>
                  Ø bis erledigt: <b>{kpis.avgToDoneMin}</b> Min<br/>
                  Neue Meldungen: <b>7d {kpis.createdLast7}</b> · <b>30d {kpis.createdLast30}</b>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-3" style={{gap:16}}>
            <Card className="p-4"><CardContent className="h-64">
              <h4 style={{margin:'0 0 8px 0', fontWeight:600}}>Meldungen je Tag</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpis.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" name="Meldungen" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent></Card>

            <Card className="p-4"><CardContent className="h-64">
              <h4 style={{margin:'0 0 8px 0', fontWeight:600}}>Nach Kategorie</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Anzahl" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent></Card>

            <Card className="p-4"><CardContent className="h-64">
              <h4 style={{margin:'0 0 8px 0', fontWeight:600}}>Statusverteilung</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.byStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Anzahl" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent></Card>
          </div>
        </div>
      )}

      <div className="grid" style={{gap:16}}>
        {filteredReports.map((r)=>(
          <Card key={r.id} className="p-4" style={{ borderLeft: `4px solid ${r.approved ? '#2563eb' : '#f59e0b'}`}}>
            <CardContent className="grid" style={{gap:8}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <p style={{fontWeight:600, margin:0}}>{r.category.toUpperCase()} {r.approved? '' : '· ungeprüft'}</p>
                <span style={{fontSize:12, color:'#6b7280'}}>ID: {r.id}</span>
              </div>
              <p style={{margin:'4px 0'}}>{r.description}</p>
              {r.image && <img src={r.image} alt="Upload" style={{borderRadius:10, width:128}}/>}
              {r.location && (<p style={{fontSize:12, color:'#6b7280', margin:0}}>{r.location.area || '—'} · PLZ {r.location.zip || '—'} · Lat {r.location.lat.toFixed(5)}, Lng {r.location.lng.toFixed(5)}</p>)}

              <div style={{fontSize:12, color:'#374151'}}>
                <div style={{display:'flex', alignItems:'center', gap:6}}><ClockIcon size={14}/>Gemeldet: <b>{formatTs((r.statusHistory||[]).find(h=>h.status==="gemeldet")?.at)}</b></div>
                <div style={{display:'flex', alignItems:'center', gap:6}}><ClockIcon size={14}/>Angenommen: <b>{formatTs((r.statusHistory||[]).find(h=>h.status==="angenommen")?.at)}</b></div>
                <div style={{display:'flex', alignItems:'center', gap:6}}><ClockIcon size={14}/>Erledigt: <b>{formatTs((r.statusHistory||[]).find(h=>h.status==="erledigt")?.at)}</b></div>
              </div>

              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <span style={{fontSize:14, color:'#059669'}}>Status: {r.status}</span>
                <span style={{fontSize:14}}>Votes: {r.votes?.count ?? 0}</span>
                <Button variant="secondary" onClick={()=>handleVote(r.id)}><Icon><ThumbsUpIcon size={16}/></Icon>Upvote</Button>
              </div>

              <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                <Button variant="outline" onClick={()=>handleStatusChange(r.id)} disabled={!(currentUser?.isAdmin || currentUser?.isModerator || (currentUser && r.reporterId === currentUser.id))}><Icon><RefreshCcwIcon size={16}/></Icon>Status ändern</Button>
                <Button variant="destructive" onClick={()=>handleDelete(r.id)}><Icon><Trash2Icon size={16}/></Icon>Löschen</Button>
                {(currentUser?.isAdmin || currentUser?.isModerator) && !r.approved && (<>
                  <Button variant="outline" onClick={()=>approveReport(r.id)}><Icon><ApproveIcon size={16}/></Icon>Freigeben</Button>
                  <Button variant="destructive" onClick={()=>rejectReport(r.id)}><Icon><RejectIcon size={16}/></Icon>Verwerfen</Button>
                </>)}
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredReports.length===0 && (<p style={{textAlign:'center', color:'#6b7280'}}>Keine Meldungen entsprechen den aktuellen Filtern/Suche.</p>)}
      </div>
    </div>
  );
}

function AuthInline({ onLogin }) {
  const [name, setName] = useState("");
  const [asAdmin, setAsAdmin] = useState(false);
  const [asModerator, setAsModerator] = useState(false);
  return (
    <div style={{display:'flex', alignItems:'center', gap:8}}>
      <Input placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} style={{width:140}} />
      <label style={{display:'flex', alignItems:'center', gap:6, fontSize:14}}><input type="checkbox" checked={asAdmin} onChange={(e)=>setAsAdmin(e.target.checked)} /> Admin (Demo)</label>
      <label style={{display:'flex', alignItems:'center', gap:6, fontSize:14}}><input type="checkbox" checked={asModerator} onChange={(e)=>setAsModerator(e.target.checked)} /> Moderator (Demo)</label>
      <Button onClick={()=>onLogin(name || "Gast", asAdmin, asModerator)}><Icon><LogInIcon size={16}/></Icon>Login</Button>
    </div>
  );
}
