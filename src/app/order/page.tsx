"use client";
/* eslint-disable @next/next/no-img-element -- QR data URLs and admin-managed menu images are rendered directly. */
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ClipboardList,
  Coffee,
  Gift,
  Music2,
  QrCode,
  Search,
  ShoppingBag,
  User,
} from "lucide-react";
import {
  api,
  defaultSettings,
  emptyLoyalty,
  statusLabel,
  type Account,
  type CafeOrder,
  type Dish,
  type PublicSettings,
  type Track,
} from "@/lib/cafe";
import { money } from "@/lib/menu";
import { Modal, Scanner } from "../cafe-ui";
import "../cafe.css";
function newRequestId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      Number(c) ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))
    ).toString(16),
  );
}
type MenuResponse = {
  items: Dish[];
  settings: PublicSettings;
  seat: { number: number; label: string; code: string } | null;
  seatError: string;
};
export default function OrderPage() {
  const [menu, setMenu] = useState<MenuResponse>({
    items: [],
    settings: defaultSettings,
    seat: null,
    seatError: "",
  });
  const [account, setAccount] = useState<Account>({
    user: null,
    profile: null,
    loyalty: emptyLoyalty,
    methods: { email: true, phone: false, google: false },
  });
  const [orders, setOrders] = useState<CafeOrder[]>([]),
    [tracks, setTracks] = useState<Track[]>([]);
  const [tab, setTab] = useState("Menu"),
    [category, setCategory] = useState("All"),
    [search, setSearch] = useState(""),
    [veg, setVeg] = useState(false),
    [sort, setSort] = useState("house");
  const [cart, setCart] = useState<Record<string, number>>({}),
    [notes, setNotes] = useState(""),
    [name, setName] = useState(""),
    [reward, setReward] = useState(false);
  const [modal, setModal] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [song, setSong] = useState({title:'',artist:'',video_id:''});
  const [channel, setChannel] = useState("phone"),
    [address, setAddress] = useState(""),
    [otp, setOtp] = useState(""),
    [sent, setSent] = useState(false),
    [cooldown, setCooldown] = useState(0);
  const request = useRef(""),
    checkoutPending = useRef(false),
    scanPending = useRef(false),
    locked = useRef(false),
    loaded = useRef(false),
    reduced = useReducedMotion();
  const close = useCallback(() => {
    if (!locked.current) setModal("");
  }, []);
  const refresh = useCallback(async () => {
    const code = new URLSearchParams(location.search).get("code") || "";
    const [m, a, o, t] = await Promise.all([
      api<MenuResponse>("/api/menu?code=" + encodeURIComponent(code)),
      api<Account>("/api/auth"),
      api<{ orders: CafeOrder[] }>("/api/orders"),
      api<{ tracks: Track[] }>("/api/music"),
    ]);
    setMenu(m);
    setAccount(a);
    if (!a.methods.phone) setChannel("email");
    setOrders(o.orders);
    setTracks(t.tracks);
  }, []);
  useEffect(() => {
    queueMicrotask(() => {
      if (!new URLSearchParams(location.search).get("code")) setModal("scan");
      try {
        const saved = JSON.parse(
          localStorage.getItem("noiric-cart-v2") || "{}",
        );
        setCart(saved.cart || {});
        setNotes(saved.notes || "");
        setName(saved.name || "");
        setReward(saved.reward === true);
        request.current = saved.request || newRequestId();
      } catch {
        request.current = newRequestId();
      }
      loaded.current = true;
    });
    Promise.resolve().then(refresh)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    const id = setInterval(
      () => refresh().catch((e) => setError(e.message)),
      12000,
    );
    return () => clearInterval(id);
  }, [refresh]);
  useEffect(() => {
    if (loaded.current)
      try {
        localStorage.setItem(
          "noiric-cart-v2",
          JSON.stringify({
            cart,
            notes,
            name,
            request: request.current,
            reward,
          }),
        );
      } catch {}
  }, [cart, notes, name, reward]);
  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  const scan = useCallback(
    async (value: string) => {
      if (scanPending.current) return;
      scanPending.current = true;
      setError("");
      try {
        const url = new URL(value, location.origin),
          code = url.searchParams.get("code");
        if (
          url.pathname !== "/order" ||
          !code ||
          !/^[a-f0-9-]{36}$/i.test(code)
        )
          throw new Error("This is not a valid table QR.");
        const verified = await api<MenuResponse>("/api/menu?code=" + encodeURIComponent(code));
        if (!verified.seat) throw new Error(verified.seatError || "This table QR is inactive.");
        history.replaceState(
          null,
          "",
          "/order?code=" + encodeURIComponent(code),
        );
        setMenu(verified);
        setModal(checkoutPending.current ? "cart" : "");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        scanPending.current = false;
      }
    },
    [],
  );
  const change = (id: string, delta: number) => {
    request.current = newRequestId();
    setCart((c) => ({
      ...c,
      [id]: Math.max(0, Math.min(10, (c[id] || 0) + delta)),
    }));
  };
  const lines = menu.items.filter((d) => cart[d.id] > 0),
    count = lines.reduce((n, d) => n + cart[d.id], 0),
    subtotal = lines.reduce((n, d) => n + d.price * cart[d.id], 0);
  const rewardDish = menu.items.find(
      (d) => d.id === menu.settings.reward_item_id,
    ),
    canReward =
      account.loyalty.rewards.some((r) => r.state === "available") &&
      !!rewardDish &&
      !!cart[rewardDish.id];
  const discount =
    reward && canReward
      ? rewardDish!.price
      : account.loyalty.returning
        ? Math.round((subtotal * menu.settings.discount_percent) / 100)
        : 0;
  const filtered = menu.items
    .filter(
      (d) =>
        (category === "All" || d.category === category) &&
        (!veg || d.veg) &&
        (d.name + " " + d.description)
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "price"
        ? a.price - b.price
        : sort === "quick"
          ? a.minutes - b.minutes
          : a.sort_order - b.sort_order,
    );
  async function submit() {
    if (locked.current) return;
    if (!menu.seat) {
      checkoutPending.current = true;
      setModal("scan");
      return;
    }
    if (!account.user) {
      checkoutPending.current = true;
      setModal("login");
      return;
    }
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          code: menu.seat.code,
          name,
          notes,
          requestId: request.current,
          items: lines.map((d) => ({ id: d.id, quantity: cart[d.id] })),
          useReward: reward && canReward,
        }),
      });
      setCart({});
      setNotes("");
      setReward(false);
      checkoutPending.current = false;
      request.current = newRequestId();
      setModal("");
      setTab("Orders");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function login() {
    setBusy(true);
    setError("");
    try {
      await api("/api/auth", {
        method: "POST",
        body: JSON.stringify({
          action: sent ? "verify" : "send",
          channel,
          address,
          token: otp,
        }),
      });
      if (sent) {
        setModal(checkoutPending.current ? "cart" : "");
        setSent(false);
        setOtp("");
        await refresh();
      } else {
        setSent(true);
        setCooldown(60);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="cafe"
      style={{ "--accent": menu.settings.accent_color } as CSSProperties}
    >
      <div className="customer-wrap">
        <header className="topbar">
          <Link className="wordmark" href="/">
            {menu.settings.cafe_name}
          </Link>
          <div className="row">
            <button
              aria-label="Scan table QR"
              onClick={() => {
                setError("");
                setModal("scan");
              }}
            >
              <QrCode size={20} />
            </button>
            <button
              onClick={() => setModal(account.user ? "account" : "login")}
              className="row"
            >
              <User size={18} />
              <span>{account.user ? "You" : "Sign in"}</span>
            </button>
          </div>
        </header>
        <section className="intro">
          <div className="row spread">
            <p className="eyebrow">GOOD FOOD. GREAT COMPANY.</p>
            <span className="pill">
              {menu.seat ? "Table " + menu.seat.number : "Explore the menu"}
            </span>
          </div>
          <h1 style={{ marginTop: 18 }}>
            {tab === "Menu"
              ? menu.settings.tagline
              : tab === "Orders"
                ? "Made for your table."
                : tab === "Rewards"
                  ? "Good to have you back."
                  : "Set the mood."}
          </h1>
          <p>
            {tab === "Menu"
              ? "Settle in. Find your favourite. We’ll take it from here."
              : tab === "Orders"
                ? "Follow your food, from the first sizzle to the final plate."
                : tab === "Rewards"
                  ? "A little thank-you for making us your regular spot."
                  : "Pick a track. Give your favourite a vote."}
          </p>
        </section>
        {error && !modal && (
          <div className="notice error" role="alert">
            {error}{" "}
            <button
              onClick={() => {
                setError("");
                refresh().catch((e) => setError(e.message));
              }}
            >
              Retry
            </button>
          </div>
        )}
        {menu.settings.announcement && (
          <p className="notice">{menu.settings.announcement}</p>
        )}
        {menu.seatError && <p className="notice">{menu.seatError}</p>}
        {!menu.settings.ordering_open && (
          <p className="notice">
            The kitchen is taking a pause. You can still browse.
          </p>
        )}
        <AnimatePresence mode="wait">
          <motion.main
            key={tab}
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {loading ? (
              <div className="empty">
                <Coffee />
                <p>Getting things ready…</p>
              </div>
            ) : tab === "Menu" ? (
              <>
                <div className="toolbar">
                  <div className="row">
                    <Search size={20} />
                    <input
                      aria-label="Search menu"
                      placeholder="What are you craving?"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                      aria-label="Sort menu"
                      style={{ width: 140 }}
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="house">House order</option>
                      <option value="price">Price: low first</option>
                      <option value="quick">Quickest first</option>
                    </select>
                  </div>
                  <div className="categories">
                    {["All", ...new Set(menu.items.map((d) => d.category))].map(
                      (c) => (
                        <button
                          key={c}
                          className={category === c ? "selected" : ""}
                          onClick={() => setCategory(c)}
                        >
                          {c}
                        </button>
                      ),
                    )}
                    <button
                      className={veg ? "selected" : ""}
                      onClick={() => setVeg(!veg)}
                    >
                      ● Veg only
                    </button>
                  </div>
                </div>
                <div className="row spread">
                  <small>{filtered.length} things to love</small>
                  <small>Freshly made, always.</small>
                </div>
                <div className="dish-grid">
                  {filtered.map((d) => (
                    <article className="dish" key={d.id}>
                      <div>
                        <div
                          className="row"
                          style={{ gap: 7, marginBottom: 9 }}
                        >
                          <span
                            aria-label={d.veg ? "Vegetarian" : "Non vegetarian"}
                            style={{ color: d.veg ? "#407144" : "#a23d31" }}
                          >
                            ●
                          </span>
                          <small>
                            {d.badge || d.category} · {d.minutes} min
                          </small>
                        </div>
                        <h3>{d.name}</h3>
                        <p>{d.description}</p>
                        <strong>{money(d.price)}</strong>
                      </div>
                      <div className="dish-visual">
                        <img
                          className="dish-photo"
                          alt={d.name}
                          src={d.image}
                          loading="lazy"
                        />
                        {!d.available ? (
                          <button disabled>Sold out</button>
                        ) : cart[d.id] ? (
                          <div className="quantity">
                            <button
                              aria-label={"Remove " + d.name}
                              onClick={() => change(d.id, -1)}
                            >
                              −
                            </button>
                            <strong aria-live="polite">{cart[d.id]}</strong>
                            <button
                              disabled={cart[d.id] >= 10}
                              aria-label={"Add " + d.name}
                              onClick={() => change(d.id, 1)}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => change(d.id, 1)}>Add +</button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
                {!filtered.length && (
                  <div className="empty">
                    <Search />
                    <p>No dishes match. Try another search.</p>
                  </div>
                )}
              </>
            ) : tab === "Orders" ? (
              <div className="stack">
                {!orders.length ? (
                  <div className="empty">
                    <ShoppingBag size={40} />
                    <h2>Your table is waiting.</h2>
                    <p className="muted">
                      Your orders will appear here once you place one.
                    </p>
                    <button onClick={() => setTab("Menu")}>
                      Find something good
                    </button>
                  </div>
                ) : (
                  orders.map((o) => (
                    <article className="panel stack" key={o.id}>
                      <div className="row spread">
                        <div>
                          <small>
                            ORDER #{o.number} · TABLE {o.seat}
                          </small>
                          <h3 style={{ marginTop: 8 }}>
                            {statusLabel[o.status]}
                          </h3>
                        </div>
                        <strong>{money(o.total)}</strong>
                      </div>
                      <p className="muted">
                        {o.items
                          .map((i) => i.quantity + " × " + i.name)
                          .join(" · ")}
                      </p>
                      {o.status === "ready" && (
                        <p className="notice">
                          Your food is ready. Our team will bring it over.
                        </p>
                      )}
                      {o.rejection_reason && (
                        <p className="notice">{o.rejection_reason}</p>
                      )}
                      <div className="row spread">
                        <small>
                          {new Date(o.created_at).toLocaleString("en-IN")}
                        </small>
                        <span className="pill">
                          {o.paid ? "Paid" : "Pay at the café"}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            ) : tab === "Rewards" ? (
              <div className="grid">
                <section className="panel">
                  <p className="eyebrow">THE REGULARS CLUB</p>
                  <h2 style={{ marginTop: 15 }}>Five visits. One on us.</h2>
                  <div className="stamps">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        className={
                          "stamp " +
                          (account.loyalty.stamps > i ? "filled" : "")
                        }
                        key={i}
                      >
                        {account.loyalty.stamps > i ? (
                          <Check size={20} />
                        ) : (
                          i + 1
                        )}
                      </span>
                    ))}
                  </div>
                  <p className="muted">
                    Visit on 5 different days within 30 days to earn a free meal
                    reward. Visits count once your food is served and payment is
                    recorded.
                  </p>
                  {!account.user && (
                    <button
                      className="primary"
                      style={{ marginTop: 20 }}
                      onClick={() => setModal("login")}
                    >
                      Sign in to collect visits
                    </button>
                  )}
                </section>
                <section className="panel stack">
                  <Gift />
                  <h2>Your little extras.</h2>
                  {menu.settings.discount_percent > 0 ? (
                    <p>
                      Come back within 30 days for{" "}
                      {menu.settings.discount_percent}% off.
                    </p>
                  ) : (
                    <p className="muted">
                      Return-visit offers will appear here when available.
                    </p>
                  )}
                  {rewardDish && (
                    <p>
                      Free meal reward: {rewardDish.name}. Add it to your cart
                      to redeem an earned reward.
                    </p>
                  )}
                  {account.loyalty.rewards.map((r) => (
                    <div className="notice" key={r.id}>
                      {r.state === "reserved"
                        ? "Reward applied to an active order"
                        : "Free meal available"}{" "}
                      · expires{" "}
                      {new Date(r.expires_at).toLocaleDateString("en-IN")}
                    </div>
                  ))}
                  <small>
                    Rewards expire after 30 days. One offer per order; free-meal
                    orders do not earn a paid visit.
                  </small>
                </section>
              </div>
            ) : (
              <div className="stack">
                <div className="panel row">
                  <div className="music-art">
                    <Music2 />
                  </div>
                  <div>
                    <small>ON THE SPEAKERS</small>
                    <h3>
                      {tracks.find((t) => t.status === "playing")?.title ||
                        "The café’s own soundtrack"}
                    </h3>
                    <p className="muted">
                      {tracks.find((t) => t.status === "playing")?.artist ||
                        "Track selection opens when the team adds a queue."}
                    </p>
                  </div>
                </div>
                <div className="row spread"><h2>Up next, your choice.</h2><button onClick={()=>{setError('');setModal(!account.user?'login':!menu.seat?'scan':'song');}}>Request a song</button></div>
                {tracks
                  .filter((t) => t.status === "queued")
                  .sort((a, b) => b.votes - a.votes)
                  .map((t, i) => (
                    <div className="panel row spread" key={t.id}>
                      <div className="row">
                        <small>{String(i + 1).padStart(2, "0")}</small>
                        <div>
                          <h3>{t.title}</h3>
                          <small>{t.artist}</small>
                        </div>
                      </div>
                      <button
                        className={t.voted ? "selected" : ""}
                        onClick={async () => {
                          if (!account.user) {
                            setModal("login");
                            return;
                          }
                          if (!menu.seat) {
                            setModal("scan");
                            return;
                          }
                          try {
                            await api("/api/music", {
                              method: "POST",
                              body: JSON.stringify({
                                action: "vote",
                                id: t.id,
                                code: menu.seat.code,
                                remove: t.voted,
                              }),
                            });
                            await refresh();
                          } catch (e) {
                            setError((e as Error).message);
                          }
                        }}
                      >
                        ↑ {t.votes}
                      </button>
                    </div>
                  ))}
                <p className="muted">
                  Votes help the team choose what plays next. Playback is
                  managed at the café.
                </p>
              </div>
            )}
          </motion.main>
        </AnimatePresence>
      </div>
      {count > 0 && tab === "Menu" && (
        <button
          className="cartbar primary row spread"
          onClick={() => {
            setError("");
            setModal("cart");
          }}
        >
          <span>
            {count} {count === 1 ? "item" : "items"} · {money(subtotal)}
          </span>
          <span className="row">
            View your order <ArrowRight size={18} />
          </span>
        </button>
      )}
      <nav className="bottomnav" aria-label="Customer navigation">
        {[
          { label: "Menu", icon: Coffee },
          { label: "Orders", icon: ClipboardList },
          { label: "Rewards", icon: Gift },
          { label: "Music", icon: Music2 },
        ].map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={tab === label ? "selected" : ""}
            onClick={() => setTab(label)}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>
      {modal && (
        <Modal
          title={
            modal === "cart"
              ? "A very good choice."
              : modal === "scan"
                ? "Find your table."
                : modal === "account"
                  ? "Your account."
                  : "Make yourself at home."
          }
          close={close}
        >
          {error && (
            <p
              className="notice error"
              role="alert"
              style={{ marginBottom: 18 }}
            >
              {error}
            </p>
          )}
          {modal === "song" ? <form className="stack" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await api('/api/music',{method:'POST',body:JSON.stringify({action:'request',code:menu.seat?.code,...song})});setSong({title:'',artist:'',video_id:''});setModal('');await refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}><p className="muted">Share a track for the queue. The café team chooses what plays.</p>{(['title','artist','video_id'] as const).map(k=><label key={k}>{k==='video_id'?'YouTube video ID (11 characters)':k==='title'?'Song title':'Artist'}<input required maxLength={k==='video_id'?11:100} value={song[k]} onChange={e=>setSong({...song,[k]:e.target.value})}/></label>)}<button className="primary" disabled={busy}>{busy?'Adding…':'Add my request'}</button></form> : modal === "scan" ? (
            <Scanner onScan={scan} />
          ) : modal === "account" ? (
            <div className="stack">
              <p>{account.user?.email || account.user?.phone}</p>
              <p className="muted">
                {account.loyalty.visits} paid visits in the last 30 days.
              </p>
              <button
                onClick={async () => {
                  try {
                    await api("/api/auth", { method: "DELETE" });
                    setModal("");
                    await refresh();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Sign out
              </button>
            </div>
          ) : modal === "login" ? (
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                void login();
              }}
            >
              <p className="muted">
                Sign in or create your account with a verification code. Your cart stays saved.
              </p>
              {account.methods.phone && !sent && (
                <div className="row">
                  <button
                    type="button"
                    className={channel === "email" ? "selected" : ""}
                    onClick={() => setChannel("email")}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    className={channel === "phone" ? "selected" : ""}
                    onClick={() => setChannel("phone")}
                  >
                    Phone
                  </button>
                </div>
              )}
              <label>
                {channel === "email"
                  ? "Email address"
                  : "Phone with country code"}
                <input
                  autoComplete={channel === "email" ? "email" : "tel"}
                  type={channel === "email" ? "email" : "tel"}
                  required
                  value={address}
                  disabled={sent}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </label>
              {sent && (
                <label>
                  Verification code
                  <input
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="[0-9]{6,10}"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </label>
              )}
              <button className="primary" disabled={busy}>
                {busy
                  ? "One moment…"
                  : sent
                    ? "Verify & continue"
                    : "Send code"}
              </button>
              {sent && (
                <button
                  type="button"
                  disabled={cooldown > 0 || busy}
                  onClick={() => {
                    setSent(false);
                    setOtp("");
                  }}
                >
                  {cooldown
                    ? "Send again in " + cooldown + "s"
                    : "Change address / send again"}
                </button>
              )}
            </form>
          ) : (
            <div className="stack">
              {lines.map((d) => (
                <div className="row spread line" key={d.id}>
                  <div>
                    <h3>{d.name}</h3>
                    <small>{money(d.price)}</small>
                    {!d.available && (
                      <p className="error">Sold out — please remove</p>
                    )}
                  </div>
                  <div className="quantity">
                    <button
                      aria-label={"Remove " + d.name}
                      disabled={busy}
                      onClick={() => change(d.id, -1)}
                    >
                      −
                    </button>
                    <span>{cart[d.id]}</span>
                    <button
                      disabled={busy || cart[d.id] >= 10}
                      aria-label={"Add " + d.name}
                      onClick={() => change(d.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              <label>
                Your name
                <input
                  maxLength={60}
                  value={name}
                  disabled={busy}
                  onChange={(e) => {
                    request.current = newRequestId();
                    setName(e.target.value);
                  }}
                  placeholder="What should we call you?"
                />
              </label>
              <label>
                Anything the kitchen should know?
                <textarea
                  maxLength={400}
                  value={notes}
                  disabled={busy}
                  onChange={(e) => {
                    request.current = newRequestId();
                    setNotes(e.target.value);
                  }}
                  placeholder="Allergies, less spice, extra love…"
                  rows={2}
                />
              </label>
              {canReward && (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={reward}
                    disabled={busy}
                    onChange={(e) => {
                      request.current = newRequestId();
                      setReward(e.target.checked);
                    }}
                  />
                  Use my free meal reward
                </label>
              )}
              <div className="row spread">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="row spread">
                  <span>Your reward</span>
                  <span>−{money(discount)}</span>
                </div>
              )}
              <div className="row spread">
                <strong>Total</strong>
                <strong>{money(subtotal - discount)}</strong>
              </div>
              <small>
                {menu.seat
                  ? "Table " + menu.seat.number
                  : "Scan your table QR to order"}{" "}
                · Pay at the café. Kitchen confirms your table before
                preparation.
              </small>
              {menu.settings.wifi_required && (
                <p className="notice">
                  Connect to the café Wi-Fi before ordering.
                </p>
              )}
              <button
                className="primary"
                disabled={
                  busy ||
                  !count ||
                  (!!menu.seat && !!account.user && !name.trim()) ||
                  !menu.settings.ordering_open ||
                  lines.some((d) => !d.available)
                }
                onClick={submit}
              >
                {busy
                  ? "Sending to the kitchen…"
                  : !menu.seat
                    ? "Scan table QR"
                    : !account.user
                      ? "Sign in / sign up to order"
                      : "Place order · " + money(subtotal - discount)}
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
