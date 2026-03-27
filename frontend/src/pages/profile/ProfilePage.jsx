import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { orderService } from "../../services";
import { fmt, fmtDate } from "../../utils/helpers";
import { ReferralCard } from "../../components/social/SocialFeatures";
import { LiveTrackingMap } from "../../components/map/MapFeatures";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const {
    theme,
    setTheme,
    vegMode,
    toggleVeg,
    points,
    addPoints,
    fontSize,
    setFontSize,
    language,
    setLanguage,
    wallet,
    addToWallet,
    streak,
    level,
    nextLevel,
    levelProgress,
    referralCode,
  } = useApp();
  const [tab, setTab] = useState("profile");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [profilePic, setProfilePic] = useState(
    localStorage.getItem("user_pic") || "",
  );
  const [addresses, setAddresses] = useState(() =>
    JSON.parse(localStorage.getItem("qb_addresses") || "[]"),
  );
  const [newAddress, setNewAddress] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });
  const [walletAmount, setWalletAmount] = useState("");
  const [splitAmount, setSplitAmount] = useState("");
  const [splitPeople, setSplitPeople] = useState(2);
  const fileRef = useRef(null);

  const TABS = [
    { key: "profile", icon: "👤", label: "Profile" },
    { key: "dashboard", icon: "📊", label: "Dashboard" },
    { key: "orders", icon: "📦", label: "Order History" },
    { key: "addresses", icon: "📍", label: "Addresses" },
    { key: "wallet", icon: "💳", label: "Wallet" },
    { key: "referral", icon: "👥", label: "Refer & Earn" },
    { key: "appearance", icon: "🎨", label: "Appearance" },
    { key: "loyalty", icon: "⭐", label: "Loyalty" },
  ];

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      setOrders(await orderService.getOrders());
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handlePic = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfilePic(ev.target.result);
      localStorage.setItem("user_pic", ev.target.result);
      toast.success("Photo updated! 📸");
    };
    reader.readAsDataURL(file);
  };

  const saveAddress = () => {
    if (!newAddress.trim()) return;
    const updated = [
      ...addresses,
      { id: Date.now(), text: newAddress, default: addresses.length === 0 },
    ];
    setAddresses(updated);
    localStorage.setItem("qb_addresses", JSON.stringify(updated));
    setNewAddress("");
    toast.success("Address saved! 📍");
  };

  // Dashboard stats
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const topCategory = (() => {
    const counts = {};
    orders.forEach((o) =>
      o.items.forEach((i) => {
        counts[i.name] = (counts[i.name] || 0) + 1;
      }),
    );
    return (
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None yet"
    );
  })();

  if (!user)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "120px 24px",
          color: "var(--mist)",
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔐</div>
        <h2
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: 28,
            color: "var(--chalk)",
            marginBottom: 8,
          }}
        >
          Login Required
        </h2>
      </div>
    );

  return (
    <div style={{ paddingTop: 68, minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "40px 24px 80px",
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Sidebar */}
        <div style={{ position: "sticky", top: 84 }}>
          {/* Profile card */}
          <div
            style={{
              background: "var(--ink-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              padding: "20px 16px",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                position: "relative",
                width: 72,
                height: 72,
                margin: "0 auto 12px",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,var(--brand),#fbbf24)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  overflow: "hidden",
                  border: "3px solid var(--brand)",
                }}
              >
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  user.name?.charAt(0).toUpperCase()
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--brand)",
                  border: "2px solid var(--ink-2)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                📷
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePic}
              />
            </div>
            <p
              style={{
                fontFamily: "Fraunces, serif",
                fontWeight: 900,
                fontSize: 15,
                marginBottom: 2,
              }}
            >
              {user.name}
            </p>
            <p style={{ color: "var(--mist)", fontSize: 11, marginBottom: 8 }}>
              {user.email}
            </p>
            {/* Level badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 99,
                background: `${level.color}20`,
                border: `1px solid ${level.color}40`,
                fontSize: 12,
                fontWeight: 700,
                color: level.color,
                marginBottom: 6,
              }}
            >
              {level.icon} {level.name}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: "var(--mist)",
                justifyContent: "center",
              }}
            >
              ⭐ {points} pts · 🔥 {streak}d streak
            </div>
          </div>

          {/* Nav */}
          <div
            style={{
              background: "var(--ink-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              padding: "8px",
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  if (t.key === "orders") loadOrders();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: "var(--r-md)",
                  border: "none",
                  background:
                    tab === t.key ? "rgba(249,115,22,0.12)" : "transparent",
                  color: tab === t.key ? "var(--brand)" : "var(--mist)",
                  fontFamily: "Cabinet Grotesk, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginBottom: 2,
                  textAlign: "left",
                  transition: "all 0.18s",
                }}
              >
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
            <div
              style={{
                height: 1,
                background: "var(--border)",
                margin: "6px 0",
              }}
            />
            <button
              onClick={logout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: "var(--r-md)",
                border: "none",
                background: "transparent",
                color: "var(--danger)",
                fontFamily: "Cabinet Grotesk, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          {/* Profile */}
          {tab === "profile" && (
            <div>
              <h2
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 28,
                  fontWeight: 900,
                  marginBottom: 24,
                }}
              >
                My Profile
              </h2>
              <div className="section-card">
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>
                  Personal Information
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <F
                    label="Full Name"
                    value={form.name}
                    onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  />
                  <F
                    label="Email"
                    value={form.email}
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                  />
                  <F
                    label="Phone"
                    value={form.phone}
                    onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                    placeholder="+1 555 000 0000"
                  />
                </div>
                <button
                  className="btn-primary"
                  onClick={() => toast.success("Profile updated! ✅")}
                  style={{ marginTop: 8, padding: "11px 26px" }}
                >
                  Save Changes
                </button>
              </div>
              <div className="section-card">
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>
                  Change Password
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <F
                    label="Current Password"
                    type="password"
                    value=""
                    onChange={() => {}}
                    placeholder="••••••••"
                  />
                  <F
                    label="New Password"
                    type="password"
                    value=""
                    onChange={() => {}}
                    placeholder="••••••••"
                  />
                </div>
                <button
                  className="btn-primary"
                  onClick={() => toast.success("Password updated! 🔐")}
                  style={{ marginTop: 8, padding: "11px 26px" }}
                >
                  Update
                </button>
              </div>
            </div>
          )}

          {/* Dashboard */}
          {tab === "dashboard" && (
            <div>
              <h2
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 28,
                  fontWeight: 900,
                  marginBottom: 24,
                }}
              >
                My Dashboard
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
                  gap: 14,
                  marginBottom: 24,
                }}
              >
                {[
                  {
                    icon: "💰",
                    label: "Total Spent",
                    value: fmt(totalSpent),
                    color: "#f97316",
                  },
                  {
                    icon: "📦",
                    label: "Orders Placed",
                    value: orders.length,
                    color: "#3b82f6",
                  },
                  {
                    icon: "✅",
                    label: "Delivered",
                    value: delivered,
                    color: "#22c55e",
                  },
                  {
                    icon: "⭐",
                    label: "Loyalty Points",
                    value: points,
                    color: "#fbbf24",
                  },
                  {
                    icon: "🔥",
                    label: "Day Streak",
                    value: `${streak} days`,
                    color: "#f97316",
                  },
                  {
                    icon: "💳",
                    label: "Wallet Balance",
                    value: fmt(wallet),
                    color: "#a855f7",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: "var(--ink-2)",
                      border: `1px solid ${s.color}20`,
                      borderRadius: "var(--r-lg)",
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 6 }}>
                      {s.icon}
                    </div>
                    <div
                      style={{
                        fontFamily: "Fraunces, serif",
                        fontSize: 22,
                        fontWeight: 900,
                        color: s.color,
                        marginBottom: 2,
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--mist)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="section-card">
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
                  🍽️ Favourite Item
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--brand)",
                  }}
                >
                  {topCategory}
                </p>
                <p style={{ color: "var(--mist)", fontSize: 13 }}>
                  Your most ordered item
                </p>
              </div>
              {/* Level progress */}
              <div className="section-card">
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
                  🏆 Your Level
                </h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <div style={{ fontSize: 36 }}>{level.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontWeight: 800,
                        fontSize: 16,
                        color: level.color,
                        marginBottom: 4,
                      }}
                    >
                      {level.name}
                    </p>
                    {nextLevel && (
                      <p style={{ color: "var(--mist)", fontSize: 12 }}>
                        {nextLevel.min - points} points to {nextLevel.name}{" "}
                        {nextLevel.icon}
                      </p>
                    )}
                  </div>
                </div>
                {nextLevel && (
                  <div
                    style={{
                      height: 8,
                      background: "var(--ink-3)",
                      borderRadius: 99,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${levelProgress}%`,
                        background: `linear-gradient(90deg,${level.color},${nextLevel.color})`,
                        borderRadius: 99,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Orders */}
          {tab === "orders" && (
            <div>
              <h2
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 28,
                  fontWeight: 900,
                  marginBottom: 24,
                }}
              >
                Order History
              </h2>
              {loadingOrders ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 48,
                    color: "var(--mist)",
                  }}
                >
                  Loading...
                </div>
              ) : orders.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 48,
                    color: "var(--mist)",
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                  <p>No orders yet</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order._id}
                    style={{
                      background: "var(--ink-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-lg)",
                      padding: "16px 20px",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 14 }}>
                          #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <p style={{ color: "var(--mist)", fontSize: 12 }}>
                          {fmtDate(order.createdAt)}
                        </p>
                      </div>
                      <p
                        style={{
                          fontWeight: 900,
                          color: "var(--brand)",
                          fontFamily: "Fraunces, serif",
                        }}
                      >
                        {fmt(order.total)}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginBottom: 10,
                      }}
                    >
                      {order.items.slice(0, 3).map((item, i) => (
                        <span
                          key={i}
                          style={{
                            background: "var(--ink-3)",
                            borderRadius: 8,
                            padding: "2px 8px",
                            fontSize: 11,
                            color: "var(--mist)",
                          }}
                        >
                          {item.emoji} {item.name}
                        </span>
                      ))}
                    </div>
                    {order.status === "delivered" && (
                      <button
                        onClick={() => toast.success("🔄 Items added to cart!")}
                        className="btn-ghost"
                        style={{ padding: "7px 14px", fontSize: 12 }}
                      >
                        🔄 Reorder
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Addresses */}
          {tab === "addresses" && (
            <div>
              <h2
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 28,
                  fontWeight: 900,
                  marginBottom: 24,
                }}
              >
                Saved Addresses
              </h2>
              <div className="section-card">
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>
                  Add New Address
                </h3>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Full delivery address..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  style={{ resize: "none", marginBottom: 12 }}
                />
                <button
                  className="btn-primary"
                  onClick={saveAddress}
                  style={{ padding: "10px 22px" }}
                >
                  + Save
                </button>
              </div>
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    background: "var(--ink-2)",
                    border: `1px solid ${addr.default ? "rgba(249,115,22,0.3)" : "var(--border)"}`,
                    borderRadius: "var(--r-lg)",
                    padding: "14px 18px",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 20 }}>
                    {addr.default ? "🏠" : "📍"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{addr.text}</p>
                    {addr.default && (
                      <span
                        className="badge badge-brand"
                        style={{ fontSize: 10, marginTop: 4 }}
                      >
                        Default
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const u = addresses.map((a) => ({
                        ...a,
                        default: a.id === addr.id,
                      }));
                      setAddresses(u);
                      localStorage.setItem("qb_addresses", JSON.stringify(u));
                      toast.success("Default updated!");
                    }}
                    className="btn-ghost"
                    style={{ padding: "5px 10px", fontSize: 11 }}
                  >
                    Set Default
                  </button>
                  <button
                    onClick={() => {
                      const u = addresses.filter((a) => a.id !== addr.id);
                      setAddresses(u);
                      localStorage.setItem("qb_addresses", JSON.stringify(u));
                    }}
                    style={{
                      padding: "5px 8px",
                      fontSize: 12,
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: 99,
                      color: "var(--danger)",
                      cursor: "pointer",
                      fontFamily: "Cabinet Grotesk, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Wallet */}
          {tab === "wallet" && (
            <div>
              <h2
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 28,
                  fontWeight: 900,
                  marginBottom: 24,
                }}
              >
                Wallet
              </h2>
              {/* Balance */}
              <div
                style={{
                  background: "linear-gradient(135deg,#a855f7,#6366f1)",
                  borderRadius: "var(--r-xl)",
                  padding: "28px 32px",
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Wallet Balance
                </p>
                <div
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontSize: 52,
                    fontWeight: 900,
                    color: "#fff",
                  }}
                >
                  {fmt(wallet)}
                </div>
              </div>
              {/* Add money */}
              <div className="section-card">
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>
                  💳 Add Money
                </h3>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {[10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        addToWallet(amt);
                        toast.success(`+${fmt(amt)} added to wallet!`);
                      }}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "var(--r-md)",
                        border: "1px solid var(--border-2)",
                        background: "var(--ink-3)",
                        color: "var(--chalk)",
                        cursor: "pointer",
                        fontFamily: "Cabinet Grotesk, sans-serif",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 0 }}>
                  <input
                    className="input"
                    type="number"
                    style={{
                      borderRadius: "var(--r-md) 0 0 var(--r-md)",
                      borderRight: "none",
                    }}
                    placeholder="Custom amount"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                  />
                  <button
                    className="btn-primary"
                    onClick={() => {
                      const amt = parseFloat(walletAmount);
                      if (!amt || amt <= 0) {
                        toast.error("Enter valid amount");
                        return;
                      }
                      addToWallet(amt);
                      setWalletAmount("");
                      toast.success(`+${fmt(amt)} added!`);
                    }}
                    style={{
                      borderRadius: "0 var(--r-md) var(--r-md) 0",
                      padding: "0 20px",
                      flexShrink: 0,
                      fontSize: 14,
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
              {/* Split bill */}
              <div className="section-card">
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>
                  🤝 Split Bill
                </h3>
                <p
                  style={{
                    color: "var(--mist)",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  Divide an order cost among friends
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--mist)",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Order Amount
                    </label>
                    <input
                      className="input"
                      type="number"
                      placeholder="$0.00"
                      value={splitAmount}
                      onChange={(e) => setSplitAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--mist)",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Number of People
                    </label>
                    <input
                      className="input"
                      type="number"
                      min="2"
                      max="20"
                      value={splitPeople}
                      onChange={(e) =>
                        setSplitPeople(parseInt(e.target.value) || 2)
                      }
                    />
                  </div>
                </div>
                {splitAmount && splitPeople > 1 && (
                  <div
                    style={{
                      padding: "16px 20px",
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      borderRadius: "var(--r-md)",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        color: "var(--mist)",
                        fontSize: 13,
                        marginBottom: 4,
                      }}
                    >
                      Each person pays
                    </p>
                    <p
                      style={{
                        fontFamily: "Fraunces, serif",
                        fontSize: 32,
                        fontWeight: 900,
                        color: "var(--success)",
                      }}
                    >
                      {fmt(parseFloat(splitAmount) / splitPeople)}
                    </p>
                    <p style={{ color: "var(--mist)", fontSize: 12 }}>
                      Split {splitPeople} ways from{" "}
                      {fmt(parseFloat(splitAmount))}
                    </p>
                  </div>
                )}
                <button
                  onClick={() =>
                    toast.success("📤 Split request sent to friends!")
                  }
                  className="btn-primary"
                  style={{ marginTop: 14, padding: "10px 22px", fontSize: 14 }}
                >
                  📤 Share Split Request
                </button>
              </div>
            </div>
          )}

          {/* Referral */}
          {tab === "referral" && (
            <div>
              <h2
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 28,
                  fontWeight: 900,
                  marginBottom: 24,
                }}
              >
                Refer & Earn
              </h2>
              <ReferralCard />
            </div>
          )}

          {/* Appearance */}
          {tab === "appearance" && (
            <div>
              <h2
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 28,
                  fontWeight: 900,
                  marginBottom: 24,
                }}
              >
                Appearance
              </h2>
              <div className="section-card">
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 18 }}>
                  🌗 Theme
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {[
                    {
                      key: "dark",
                      label: "🌙 Dark Mode",
                      desc: "Easy on the eyes",
                    },
                    {
                      key: "light",
                      label: "☀️ Light Mode",
                      desc: "Clean and bright",
                    },
                  ].map((t) => (
                    <div
                      key={t.key}
                      onClick={() => setTheme(t.key)}
                      style={{
                        padding: "16px 18px",
                        borderRadius: "var(--r-lg)",
                        border: `2px solid ${theme === t.key ? "var(--brand)" : "var(--border-2)"}`,
                        background:
                          theme === t.key
                            ? "rgba(249,115,22,0.08)"
                            : "var(--ink-3)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 800,
                          fontSize: 14,
                          marginBottom: 3,
                        }}
                      >
                        {t.label}
                      </p>
                      <p style={{ color: "var(--mist)", fontSize: 12 }}>
                        {t.desc}
                      </p>
                      {theme === t.key && (
                        <p
                          style={{
                            color: "var(--brand)",
                            fontSize: 11,
                            fontWeight: 700,
                            marginTop: 6,
                          }}
                        >
                          ✓ Active
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="section-card">
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>
                  🌍 Language
                </h3>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { key: "en", label: "🇺🇸 English" },
                    { key: "hi", label: "🇮🇳 हिंदी" },
                  ].map((l) => (
                    <button
                      key={l.key}
                      onClick={() => {
                        setLanguage(l.key);
                        toast.success(`Language changed to ${l.label}`);
                      }}
                      style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: "var(--r-lg)",
                        border: `2px solid ${language === l.key ? "var(--brand)" : "var(--border-2)"}`,
                        background:
                          language === l.key
                            ? "rgba(249,115,22,0.1)"
                            : "var(--ink-3)",
                        color:
                          language === l.key ? "var(--brand)" : "var(--chalk)",
                        cursor: "pointer",
                        fontFamily: "Cabinet Grotesk, sans-serif",
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="section-card">
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>
                  🔤 Font Size
                </h3>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { key: "small", label: "Small", size: "13px" },
                    { key: "medium", label: "Medium", size: "15px" },
                    { key: "large", label: "Large", size: "17px" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFontSize(f.key)}
                      style={{
                        flex: 1,
                        padding: "13px",
                        borderRadius: "var(--r-lg)",
                        border: `2px solid ${fontSize === f.key ? "var(--brand)" : "var(--border-2)"}`,
                        background:
                          fontSize === f.key
                            ? "rgba(249,115,22,0.08)"
                            : "var(--ink-3)",
                        color:
                          fontSize === f.key ? "var(--brand)" : "var(--chalk)",
                        cursor: "pointer",
                        fontFamily: "Cabinet Grotesk, sans-serif",
                        fontWeight: 700,
                        fontSize: f.size,
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="section-card">
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>
                  🥦 Veg Mode
                </h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    background: "var(--ink-3)",
                    borderRadius: "var(--r-md)",
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 700, marginBottom: 2 }}>
                      🟢 Vegetarian Only
                    </p>
                    <p style={{ color: "var(--mist)", fontSize: 13 }}>
                      Show only veg items in menu
                    </p>
                  </div>
                  <div
                    onClick={toggleVeg}
                    style={{
                      width: 50,
                      height: 26,
                      borderRadius: 99,
                      background: vegMode ? "var(--success)" : "var(--ink-4)",
                      border: `2px solid ${vegMode ? "var(--success)" : "var(--border-2)"}`,
                      cursor: "pointer",
                      position: "relative",
                      transition: "all 0.3s",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 1,
                        left: vegMode ? 22 : 1,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.3s",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loyalty */}
          {tab === "loyalty" && (
            <div>
              <h2
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 28,
                  fontWeight: 900,
                  marginBottom: 24,
                }}
              >
                Loyalty Points
              </h2>
              <div
                style={{
                  background: "linear-gradient(135deg,var(--brand),#fbbf24)",
                  borderRadius: "var(--r-xl)",
                  padding: "32px",
                  marginBottom: 20,
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                  }}
                />
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.8)",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Your Balance
                </p>
                <div
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontSize: 60,
                    fontWeight: 900,
                    color: "#fff",
                    lineHeight: 1,
                    marginBottom: 6,
                  }}
                >
                  {points}
                </div>
                <p style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                  QuickBite Points · {level.icon} {level.name}
                </p>
              </div>
              <div className="section-card">
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>
                  🎁 Redeem Rewards
                </h3>
                {[
                  { pts: 100, reward: "5% off next order" },
                  { pts: 250, reward: "Free delivery" },
                  { pts: 500, reward: "$5 off any order" },
                  { pts: 1000, reward: "$15 off any order" },
                  { pts: 2000, reward: "Free meal up to $20" },
                ].map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      marginBottom: 8,
                      background: "var(--ink-3)",
                      borderRadius: "var(--r-md)",
                      opacity: points >= r.pts ? 1 : 0.5,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>🎁</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>
                        {r.reward}
                      </p>
                      <p style={{ color: "var(--mist)", fontSize: 12 }}>
                        {r.pts} points required
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (points >= r.pts) {
                          toast.success(`🎉 Redeemed: ${r.reward}!`);
                        } else {
                          toast.error(`Need ${r.pts - points} more points`);
                        }
                      }}
                      className={points >= r.pts ? "btn-primary" : "btn-ghost"}
                      style={{ padding: "7px 14px", fontSize: 12 }}
                    >
                      {points >= r.pts ? "Redeem" : "Locked"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function F({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 700,
          color: "var(--mist)",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </label>
      <input
        className="input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
