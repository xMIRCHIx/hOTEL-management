"use client";
/* eslint-disable @next/next/no-img-element -- QR data URLs and admin-managed menu images are rendered directly. */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Armchair,
  BarChart3,
  ChefHat,
  Coffee,
  LogOut,
  Music2,
  Plus,
  QrCode,
  Settings as SettingsIcon,
  Users,
  Volume2,
} from "lucide-react";
import QRCode from "qrcode";
import {
  api,
  statusLabel,
  type CafeOrder,
  type Customer,
  type Dish,
  type Seat,
  type Settings,
  type Track,
} from "@/lib/cafe";
import { money } from "@/lib/menu";
import { Modal } from "../cafe-ui";
import "../cafe.css";
type Workspace = {
  items: Dish[];
  seats: Seat[];
  settings: Settings;
  orders: CafeOrder[];
  customers: Customer[];
  wifiSupported: boolean;
};
const blank: Dish = {
  id: "",
  name: "",
  category: "Kitchen",
  description: "",
  image: "/loaded_pizza.png",
  price: 199,
  veg: true,
  badge: "",
  minutes: 15,
  available: true,
  archived: false,
  sort_order: 0,
};
const views = [
  { name: "Overview", icon: BarChart3 },
  { name: "Kitchen", icon: ChefHat },
  { name: "Menu", icon: Coffee },
  { name: "Tables & QR", icon: QrCode },
  { name: "Customers", icon: Users },
  { name: "Music", icon: Music2 },
  { name: "Settings", icon: SettingsIcon },
];
function QRImage({ value }: { value: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(value, {
      width: 600,
      margin: 2,
      errorCorrectionLevel: "M",
    }).then((s) => {
      if (live) setSrc(s);
    });
    return () => {
      live = false;
    };
  }, [value]);
  return src ? (
    <>
      <img src={src} alt="Scannable QR code" />
      <a className="no-print" href={src} download="noiric-qr.png">
        Download PNG
      </a>
    </>
  ) : (
    <p>Preparing QR…</p>
  );
}
export default function Admin() {
  const [data, setData] = useState<Workspace | null>(null),
    [authenticated, setAuthenticated] = useState(false),
    [loading, setLoading] = useState(true),
    [password, setPassword] = useState(""),
    [view, setView] = useState("Overview");
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("active");
  const [edit, setEdit] = useState<Dish | null>(null),
    [seat, setSeat] = useState<Partial<Seat> | null>(null),
    [config, setConfig] = useState<
      (Omit<Settings, "wifi_public_ips"> & { wifi_public_ips: string }) | null
    >(null);
  const [confirm, setConfirm] = useState<{
      order: CafeOrder;
      action: string;
    } | null>(null),
    [reason, setReason] = useState(""),
    [verified, setVerified] = useState(false),
    [base, setBase] = useState(""),
    [sound, setSound] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]),
    [track, setTrack] = useState({ title: "", artist: "", video_id: "" }),
    [customer, setCustomer] = useState<Customer | null>(null);
  const seen = useRef<Set<string> | null>(null),
    soundRef = useRef(false),
    lock = useRef(false);
  const close = useCallback(() => {
    if (lock.current) return;
    setEdit(null);
    setSeat(null);
    setConfirm(null);
    setCustomer(null);
  }, []);
  const refresh = useCallback(async () => {
    const d = await api<Workspace>("/api/admin");
    setAuthenticated(true);
    setData(d);
    const fresh = d.orders.filter(
      (o) => o.status === "received" && !seen.current?.has(o.id),
    );
    if (seen.current && soundRef.current && "speechSynthesis" in window)
      fresh.forEach((o) => {
        const u = new SpeechSynthesisUtterance(
          "Table " +
            o.seat +
            ". " +
            o.customer_name +
            " ordered " +
            o.items.map((i) => i.quantity + " " + i.name).join(", "),
        );
        u.lang = "en-IN";
        speechSynthesis.speak(u);
      });
    seen.current = new Set(d.orders.map((o) => o.id));
    setTracks((await api<{ tracks: Track[] }>("/api/music")).tracks);
  }, []);
  useEffect(() => {
    queueMicrotask(() => {
      setBase(localStorage.getItem("noiric-qr-base") || location.origin);
      if (new URLSearchParams(location.search).get("view") === "kitchen")
        setView("Kitchen");
    });
    Promise.resolve().then(refresh)
      .catch((e) => {
        if (!e.message.includes("sign in")) setError(e.message);
      })
      .finally(() => setLoading(false));
    const timer = setInterval(
      () => refresh().catch((e) => setError(e.message)),
      10000,
    );
    return () => clearInterval(timer);
  }, [refresh]);
  async function save(entity: string, value: unknown) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await api("/api/admin", {
        method: "POST",
        body: JSON.stringify({ entity, data: value }),
      });
      setEdit(null);
      setSeat(null);
      setCustomer(null);
      setNotice("Changes saved.");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function updateOrder() {
    if (!confirm || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await api("/api/kitchen", {
        method: "PATCH",
        body: JSON.stringify({
          id: confirm.order.id,
          action: confirm.action,
          verified,
          reason,
        }),
      });
      setConfirm(null);
      await refresh();
      setNotice("Order updated.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function action(o: CafeOrder, a: string) {
    setReason("");
    setVerified(false);
    setConfirm({ order: o, action: a });
    setError("");
  }
  async function music(action: string, id?: string) {
    setError("");
    try {
      await api("/api/music", {
        method: "POST",
        body: JSON.stringify({ action, id, ...track }),
      });
      setTrack({ title: "", artist: "", video_id: "" });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const navigate = (v: string) => {
    setView(v);
    setSearch("");
    setNotice("");
    if (v === "Settings" && data)
      setConfig({
        ...data.settings,
        wifi_public_ips: data.settings.wifi_public_ips.join(", "),
      });
  };
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  const todays =
    data?.orders.filter(
      (o) =>
        new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
          new Date(o.created_at),
        ) === today,
    ) || [];
  const paid = todays.filter((o) => o.paid),
    active =
      data?.orders.filter((o) =>
        ["received", "preparing", "ready"].includes(o.status),
      ) || [];
  const tickets = (
    filter === "active"
      ? active
      : data?.orders.filter((o) => filter === "all" || o.status === filter) ||
        []
  ).filter((o) =>
    (o.seat + " " + o.customer_name + " " + o.number)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  function qrUrl(s: Seat) {
    try {
      const url = new URL("/order", base);
      if (!["http:", "https:"].includes(url.protocol)) return "";
      url.searchParams.set("seat", String(s.number));
      url.searchParams.set("code", s.code);
      return url.toString();
    } catch {
      return "";
    }
  }
  const wifiQR = config
    ? "WIFI:T:" +
      config.wifi_security +
      ";S:" +
      config.wifi_ssid.replace(/([\\;,:"])/g, "\\$1") +
      ";P:" +
      config.wifi_password.replace(/([\\;,:"])/g, "\\$1") +
      ";;"
    : "";
  if (!authenticated)
    return (
      <div className="cafe">
        <div className="login">
          <Link className="wordmark" href="/">
            NOIRIC
          </Link>
          <h1 style={{ marginTop: 30 }}>Behind the counter.</h1>
          <p className="muted" style={{ marginTop: 16 }}>
            Your café, all in one place.
          </p>
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await api("/api/kitchen", {
                  method: "POST",
                  body: JSON.stringify({ password }),
                });
                setPassword("");
                await refresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Staff password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="primary" disabled={busy || loading}>
              {loading
                ? "Checking session…"
                : busy
                  ? "Signing in…"
                  : "Open workspace →"}
            </button>
          </form>
        </div>
      </div>
    );
  return (
    <div className="cafe">
      <div className="admin-shell">
        <aside className="sidebar">
          <Link href="/" className="wordmark">
            {data?.settings.cafe_name || "NOIRIC"}
          </Link>
          <small style={{ color: "#b7b7a4" }}>THE CAFÉ WORKSPACE</small>
          <nav>
            {views.map(({ name, icon: Icon }) => (
              <button
                key={name}
                className={view === name ? "selected" : ""}
                onClick={() => navigate(name)}
              >
                <Icon size={18} />
                {name}
                {name === "Kitchen" && active.length > 0 && (
                  <span className="pill">{active.length}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-foot" style={{ marginTop: "auto" }}>
            <a href="/order" target="_blank" style={{ color: "inherit" }}>
              Open customer menu ↗
            </a>
          </div>
          <button
            onClick={async () => {
              try {
                await api("/api/kitchen", { method: "DELETE" });
                setAuthenticated(false);
                setData(null);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <LogOut size={18} />
            Sign out
          </button>
        </aside>
        <main className="admin-main">
          <header className="admin-header row spread">
            <div>
              <p className="eyebrow">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <h1 style={{ marginTop: 10 }}>
                {view === "Overview"
                  ? "A good day starts here."
                  : view === "Kitchen"
                    ? "On the pass."
                    : view === "Menu"
                      ? "Made with intention."
                      : view === "Tables & QR"
                        ? "Every seat, connected."
                        : view === "Customers"
                          ? "Your regulars."
                          : view === "Music"
                            ? "The listening room."
                            : "Make it yours."}
              </h1>
            </div>
            <button
              onClick={() => refresh().catch((e) => setError(e.message))}
              aria-label="Refresh workspace"
            >
              ↻
            </button>
          </header>
          {error && !edit && !seat && !confirm && !customer && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="notice" style={{ marginBottom: 18 }}>
              {notice}
            </p>
          )}
          {data && view === "Overview" && (
            <div className="stack">
              <div className="stats">
                <div className="panel stat">
                  <small>PAID SALES TODAY</small>
                  <strong>
                    {money(paid.reduce((s, o) => s + o.total, 0))}
                  </strong>
                </div>
                <div className="panel stat">
                  <small>ORDERS TODAY</small>
                  <strong>{todays.length}</strong>
                </div>
                <div className="panel stat">
                  <small>ON THE PASS</small>
                  <strong>{active.length}</strong>
                </div>
              </div>
              <div className="panel">
                <div className="row spread">
                  <h2>Recent orders</h2>
                  <button onClick={() => navigate("Kitchen")}>
                    View kitchen →
                  </button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Table / guest</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.orders.slice(0, 12).map((o) => (
                        <tr key={o.id}>
                          <td>#{o.number}</td>
                          <td>
                            {o.seat} · {o.customer_name}
                          </td>
                          <td>{statusLabel[o.status]}</td>
                          <td>{money(o.total)}</td>
                          <td>{o.paid ? "Paid" : "Unpaid"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!data.orders.length && (
                    <div className="empty">
                      Your first order will appear here.
                    </div>
                  )}
                </div>
              </div>
              <p className="muted">
                Sales reflect recorded payments in the latest 500 orders. Profit
                needs ingredient, wage and operating costs; it is not estimated
                here.
              </p>
            </div>
          )}
          {view === "Kitchen" && (
            <div className="stack">
              <div className="row wrap">
                <input
                  style={{ flex: 1, minWidth: 160 }}
                  placeholder="Find table, guest or order…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  style={{ width: 170 }}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {[
                    "active",
                    "received",
                    "preparing",
                    "ready",
                    "served",
                    "cancelled",
                    "all",
                  ].map((f) => (
                    <option key={f} value={f}>
                      {f === "active"
                        ? "Active tickets"
                        : f === "all"
                          ? "All orders"
                          : statusLabel[f]}
                    </option>
                  ))}
                </select>
                <button
                  className={sound ? "selected" : ""}
                  onClick={() => {
                    const enabled = !sound;
                    setSound(enabled);
                    soundRef.current = enabled;
                    if (enabled && "speechSynthesis" in window)
                      speechSynthesis.speak(
                        new SpeechSynthesisUtterance(
                          "Kitchen announcements enabled",
                        ),
                      );
                  }}
                >
                  <Volume2 size={18} /> {sound ? "Sound on" : "Enable sound"}
                </button>
              </div>
              <div className="tickets">
                {tickets.map((o) => (
                  <article className="panel ticket stack" key={o.id}>
                    <div className="row spread">
                      <h2>Table {o.seat}</h2>
                      <span className="pill">#{o.number}</span>
                    </div>
                    <div>
                      <strong>{o.customer_name}</strong>
                      <p className="muted" style={{ marginTop: 6 }}>
                        {statusLabel[o.status]} ·{" "}
                        {new Date(o.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <ul>
                      {o.items.map((i) => (
                        <li key={i.id}>
                          <strong>{i.quantity} ×</strong> {i.name}
                        </li>
                      ))}
                    </ul>
                    {o.notes && <p className="notice">{o.notes}</p>}
                    <div className="row spread">
                      <strong>{money(o.total)}</strong>
                      <small>{o.paid ? "Paid" : "Payment pending"}</small>
                    </div>
                    {["received", "preparing", "ready"].includes(o.status) && (
                      <button
                        className="primary"
                        onClick={() =>
                          action(
                            o,
                            o.status === "received"
                              ? "preparing"
                              : o.status === "preparing"
                                ? "ready"
                                : "served",
                          )
                        }
                      >
                        {o.status === "received"
                          ? "Confirm table & accept"
                          : o.status === "preparing"
                            ? "Food is ready"
                            : "Mark served"}
                      </button>
                    )}
                    <div className="row wrap">
                      {!o.paid && o.status !== "cancelled" && (
                        <button onClick={() => action(o, "paid")}>
                          Record payment
                        </button>
                      )}
                      {!o.paid &&
                        ["received", "preparing", "ready"].includes(
                          o.status,
                        ) && (
                          <button
                            className="danger"
                            onClick={() => action(o, "cancelled")}
                          >
                            Cancel
                          </button>
                        )}
                    </div>
                  </article>
                ))}
              </div>
              {!tickets.length && (
                <div className="empty">
                  <ChefHat size={42} />
                  <h2>A clear pass.</h2>
                  <p className="muted">
                    Matching orders will appear here. Updates every 10 seconds.
                  </p>
                </div>
              )}
            </div>
          )}
          {data && view === "Menu" && (
            <div className="stack">
              <div className="row">
                <input
                  placeholder="Search dishes or categories…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  className="primary row"
                  style={{ whiteSpace: "nowrap" }}
                  onClick={() => {
                    setError("");
                    setEdit({ ...blank });
                  }}
                >
                  <Plus size={18} />
                  Add dish
                </button>
              </div>
              <div className="panel table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Dish</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Availability</th>
                      <th>Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items
                      .filter((d) =>
                        (d.name + " " + d.category)
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((d) => (
                        <tr key={d.id}>
                          <td>
                            {d.name}
                            {d.archived && " (archived)"}
                          </td>
                          <td>{d.category}</td>
                          <td>{money(d.price)}</td>
                          <td>
                            <button
                              disabled={busy || d.archived}
                              onClick={() =>
                                save("menu", { ...d, available: !d.available })
                              }
                            >
                              {d.available ? "Available" : "Sold out"}
                            </button>
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                setError("");
                                setEdit({ ...d });
                              }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {data && view === "Tables & QR" && (
            <div className="stack">
              <div className="panel stack">
                <div className="row spread">
                  <h2>Scan. Settle in. Order.</h2>
                  <Armchair />
                </div>
                <label>
                  Customer website address
                  <input
                    type="url"
                    value={base}
                    onChange={(e) => {
                      setBase(e.target.value);
                      localStorage.setItem("noiric-qr-base", e.target.value);
                    }}
                    placeholder="https://your-cafe.com"
                  />
                </label>
                <p className="muted">
                  For phone testing, use this computer’s local network address
                  with :3000 and connect both devices to the same Wi-Fi.
                  Localhost works only on this computer.
                </p>
                <div className="row wrap">
                  <button
                    className="primary"
                    onClick={() =>
                      setSeat({
                        number: Math.min(
                          100,
                          Math.max(0, ...data.seats.map((s) => s.number)) + 1,
                        ),
                        label: "",
                        active: true,
                      })
                    }
                  >
                    + Add table
                  </button>
                  <button onClick={() => window.print()}>
                    Print table cards
                  </button>
                </div>
              </div>
              <div className="qr-grid print-area">
                {data.seats.map((s) => (
                  <article className="panel qr-card" key={s.id}>
                    <p className="eyebrow">{data.settings.cafe_name}</p>
                    <h2 style={{ marginTop: 12 }}>Table {s.number}</h2>
                    <p className="muted">
                      {s.label || "Good food starts here."}
                    </p>
                    {s.active && qrUrl(s) ? (
                      <QRImage value={qrUrl(s)} />
                    ) : (
                      <p className="notice">
                        {!s.active
                          ? "QR inactive"
                          : "Enter a valid website address."}
                      </p>
                    )}
                    <p style={{ marginTop: 15 }}>Scan to explore & order</p>
                    <div
                      className="no-print row"
                      style={{ justifyContent: "center", marginTop: 14 }}
                    >
                      <button
                        onClick={() => {
                          setError("");
                          setSeat({ ...s });
                        }}
                      >
                        Edit table
                      </button>
                      {s.active && qrUrl(s) && (
                        <a href={qrUrl(s)} target="_blank" rel="noreferrer">
                          Open menu ↗
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
          {data && view === "Customers" && (
            <div className="stack">
              <p className="notice">
                Verified accounts keep their visit history. Restrict an account
                only after checking the incident with the customer; kitchen
                confirmation still protects each table.
              </p>
              <input
                placeholder="Search email or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="panel table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Joined</th>
                      <th>Account</th>
                      <th>Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers
                      .filter((c) =>
                        (c.email + " " + c.phone)
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((c) => (
                        <tr key={c.id}>
                          <td>{c.name || c.email || c.phone}</td>
                          <td>
                            {new Date(c.created_at).toLocaleDateString("en-IN")}
                          </td>
                          <td>
                            {c.blocked_until &&
                            new Date(c.blocked_until) > new Date()
                              ? "Restricted until " +
                                new Date(c.blocked_until).toLocaleDateString(
                                  "en-IN",
                                )
                              : "Active"}
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                setCustomer(c);
                                setReason("");
                                setError("");
                              }}
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {!data.customers.length && (
                  <div className="empty">
                    <Users />
                    <p>Customers appear after their first sign-in.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {view === "Music" && (
            <div className="grid">
              <section className="stack">
                <div className="panel stack">
                  <p className="eyebrow">NOW PLAYING</p>
                  <h2>
                    {tracks.find((t) => t.status === "playing")?.title ||
                      "Make room for music."}
                  </h2>
                  <p className="muted">
                    {tracks.find((t) => t.status === "playing")?.artist ||
                      "Add your first track to the queue."}
                  </p>
                  <p className="notice">
                    This is the music queue and voting interface. YouTube Music
                    playback and autoplay are not connected yet.
                  </p>
                </div>
                {tracks
                  .filter((t) => t.status === "queued")
                  .sort((a, b) => b.votes - a.votes)
                  .map((t) => (
                    <div className="panel stack" key={t.id}>
                      <div className="row spread">
                        <div>
                          <h3>{t.title}</h3>
                          <small>{t.artist}</small>
                        </div>
                        <span className="pill">{t.votes} votes</span>
                      </div>
                      <div className="row">
                        <button onClick={() => music("play", t.id)}>
                          Mark now playing
                        </button>
                        <button
                          className="danger"
                          onClick={() => music("remove", t.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
              </section>
              <form
                className="panel stack"
                style={{ alignSelf: "start" }}
                onSubmit={(e) => {
                  e.preventDefault();
                  void music("add");
                }}
              >
                <h2>Add to the queue.</h2>
                <label>
                  Track title
                  <input
                    required
                    maxLength={100}
                    value={track.title}
                    onChange={(e) =>
                      setTrack({ ...track, title: e.target.value })
                    }
                  />
                </label>
                <label>
                  Artist
                  <input
                    required
                    maxLength={100}
                    value={track.artist}
                    onChange={(e) =>
                      setTrack({ ...track, artist: e.target.value })
                    }
                  />
                </label>
                <label>
                  YouTube video ID
                  <input
                    required
                    pattern="[a-zA-Z0-9_-]{11}"
                    placeholder="11-character video ID"
                    value={track.video_id}
                    onChange={(e) =>
                      setTrack({ ...track, video_id: e.target.value })
                    }
                  />
                </label>
                <button className="primary">Add track</button>
              </form>
            </div>
          )}
          {data && view === "Settings" && config && (
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                void save("settings", config);
              }}
            >
              <div className="grid">
                <section className="panel stack">
                  <h2>Your café, your voice.</h2>
                  <label>
                    Café name
                    <input
                      required
                      value={config.cafe_name}
                      onChange={(e) =>
                        setConfig({ ...config, cafe_name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Menu headline
                    <input
                      value={config.tagline}
                      onChange={(e) =>
                        setConfig({ ...config, tagline: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Announcement
                    <textarea
                      rows={2}
                      value={config.announcement}
                      onChange={(e) =>
                        setConfig({ ...config, announcement: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Accent colour
                    <input
                      type="color"
                      value={config.accent_color}
                      onChange={(e) =>
                        setConfig({ ...config, accent_color: e.target.value })
                      }
                    />
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={config.ordering_open}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          ordering_open: e.target.checked,
                        })
                      }
                    />
                    Accept orders
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked
                      disabled
                    />
                    Verified sign-in is required at checkout. Menu browsing is public.
                  </label>
                </section>
                <section className="panel stack">
                  <h2>A reason to return.</h2>
                  <label>
                    Return within 30 days: discount %
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={config.discount_percent}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          discount_percent: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    Free meal after 5 paid visit days
                    <select
                      value={config.reward_item_id || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          reward_item_id: e.target.value || null,
                        })
                      }
                    >
                      <option value="">Choose a reward dish</option>
                      {data.items
                        .filter((d) => !d.archived)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <p className="muted">
                    A visit counts once per day after serving and recording
                    payment. Earned rewards expire in 30 days. Customers cannot
                    combine the free meal and return discount on the same order.
                  </p>
                  <p className="notice">
                    Email OTP is sent directly through Resend; no SMTP setup is
                    needed. The test sender works for development; add and
                    verify your own sending domain in Resend before sending to
                    all customers, then set RESEND_FROM on the server. Phone
                    sign-in can be enabled later when an SMS service is ready.
                  </p>
                </section>
              </div>
              <section className="panel stack">
                <h2>Wi-Fi, without the spelling bee.</h2>
                <div className="form-grid">
                  <label>
                    Network name (SSID)
                    <input
                      maxLength={32}
                      value={config.wifi_ssid}
                      onChange={(e) =>
                        setConfig({ ...config, wifi_ssid: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="password"
                      maxLength={63}
                      value={config.wifi_password}
                      onChange={(e) =>
                        setConfig({ ...config, wifi_password: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Security
                    <select
                      value={config.wifi_security}
                      onChange={(e) =>
                        setConfig({ ...config, wifi_security: e.target.value })
                      }
                    >
                      <option>WPA</option>
                      <option>WEP</option>
                      <option value="nopass">Open network</option>
                    </select>
                  </label>
                  <label>
                    Café public IP addresses
                    <input
                      value={config.wifi_public_ips}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          wifi_public_ips: e.target.value,
                        })
                      }
                      placeholder="Comma separated"
                    />
                  </label>
                </div>
                <label className="check">
                  <input
                    type="checkbox"
                    disabled={!data.wifiSupported}
                    checked={config.wifi_required}
                    onChange={(e) =>
                      setConfig({ ...config, wifi_required: e.target.checked })
                    }
                  />
                  Require café Wi-Fi for orders and votes
                </label>
                <p className="muted">
                  {data.wifiSupported
                    ? "Use the café’s fixed public IP."
                    : "Enforcement becomes available after supported hosting is configured."}{" "}
                  Wi-Fi and table QR are separate scans. Connecting needs the
                  customer’s confirmation.
                </p>
                {config.wifi_ssid && (
                  <div className="qr-card print-area">
                    <div>
                      <h2>{config.wifi_ssid}</h2>
                      <QRImage value={wifiQR} />
                      <p>Scan to join our Wi-Fi</p>
                      <button type="button" onClick={() => window.print()}>
                        Print Wi-Fi card
                      </button>
                    </div>
                  </div>
                )}
              </section>
              <button className="primary" disabled={busy}>
                {busy ? "Saving…" : "Save settings"}
              </button>
            </form>
          )}
        </main>
      </div>
      {edit && (
        <Modal
          title={edit.id ? "Edit the dish." : "Something new."}
          close={close}
          wide
        >
          {error && <p className="notice error">{error}</p>}
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              void save("menu", edit);
            }}
          >
            {(
              ["name", "category", "description", "image", "badge"] as const
            ).map((k) => (
              <label
                className={k === "description" || k === "image" ? "full" : ""}
                key={k}
              >
                {k === "image"
                  ? "Image URL or /local-file.png"
                  : k[0].toUpperCase() + k.slice(1)}
                <input
                  required={["name", "category", "image"].includes(k)}
                  value={edit[k]}
                  onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
                />
              </label>
            ))}
            {(["price", "minutes", "sort_order"] as const).map((k) => (
              <label key={k}>
                {k === "sort_order"
                  ? "Display order (lower first)"
                  : k === "price"
                    ? "Price ₹"
                    : "Preparation minutes"}
                <input
                  type="number"
                  min={k === "sort_order" ? 0 : 1}
                  max={k === "minutes" ? 180 : k === "price" ? 100000 : 9999}
                  value={edit[k]}
                  onChange={(e) =>
                    setEdit({ ...edit, [k]: Number(e.target.value) })
                  }
                />
              </label>
            ))}
            {(["veg", "available", "archived"] as const).map((k) => (
              <label className="check" key={k}>
                <input
                  type="checkbox"
                  checked={edit[k]}
                  onChange={(e) => setEdit({ ...edit, [k]: e.target.checked })}
                />
                {k === "veg"
                  ? "Vegetarian"
                  : k === "archived"
                    ? "Archive / remove from menu"
                    : "Available to order"}
              </label>
            ))}
            <small className="full">
              Archiving removes the dish from the customer menu and keeps past
              orders intact.
            </small>
            <button className="primary full" disabled={busy}>
              {busy ? "Saving…" : "Save dish"}
            </button>
          </form>
        </Modal>
      )}
      {seat && (
        <Modal title="A seat at the table." close={close}>
          {error && <p className="notice error">{error}</p>}
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              void save("seat", seat);
            }}
          >
            <label>
              Table number
              <input
                type="number"
                required
                min={1}
                max={100}
                value={seat.number}
                onChange={(e) =>
                  setSeat({ ...seat, number: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Label
              <input
                maxLength={60}
                value={seat.label}
                onChange={(e) => setSeat({ ...seat, label: e.target.value })}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={seat.active}
                onChange={(e) => setSeat({ ...seat, active: e.target.checked })}
              />
              Active QR
            </label>
            <button className="primary" disabled={busy}>
              Save table
            </button>
            {seat.id && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      "Replace this table QR? The printed old QR will stop working.",
                    )
                  )
                    void save("seat", { ...seat, regenerate: true });
                }}
              >
                Replace QR code
              </button>
            )}
          </form>
        </Modal>
      )}
      {confirm && (
        <Modal
          title={
            confirm.action === "preparing"
              ? "Is the table occupied?"
              : confirm.action === "paid"
                ? "Record this payment?"
                : confirm.action === "cancelled"
                  ? "Cancel this order?"
                  : "Update the kitchen."
          }
          close={close}
        >
          <div className="stack">
            {error && <p className="notice error">{error}</p>}
            <p>
              Table {confirm.order.seat} · {confirm.order.customer_name} · #
              {confirm.order.number}
            </p>
            {confirm.action === "preparing" && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                />
                I have checked that this customer is at this table.
              </label>
            )}
            {confirm.action === "paid" && (
              <p>
                Confirm that {money(confirm.order.total)} has actually been
                received at the café.
              </p>
            )}
            {confirm.action === "cancelled" && (
              <label>
                Reason shown to the customer
                <textarea
                  required
                  maxLength={200}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
            )}
            <button
              className="primary"
              disabled={
                busy ||
                (confirm.action === "preparing" && !verified) ||
                (confirm.action === "cancelled" && reason.trim().length < 3)
              }
              onClick={updateOrder}
            >
              {busy ? "Updating…" : "Confirm"}
            </button>
          </div>
        </Modal>
      )}
      {customer && (
        <Modal title="Review account." close={close}>
          <div className="stack">
            {error && <p className="notice error">{error}</p>}
            <p>{customer.email || customer.phone}</p>
            <label>
              Incident / review reason
              <textarea
                value={reason}
                maxLength={200}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <button
              disabled={busy || !reason.trim()}
              onClick={() =>
                save("customer", { id: customer.id, days: 7, reason })
              }
            >
              Restrict ordering for 7 days
            </button>
            <button
              disabled={busy || !reason.trim()}
              onClick={() =>
                save("customer", { id: customer.id, days: 0, reason })
              }
            >
              Restore account access
            </button>
            <small>Past loyalty history is preserved.</small>
          </div>
        </Modal>
      )}
    </div>
  );
}
