import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminService } from "../../services/adminService";
import { fmt, fmtDate, fmtTime, STATUS_MAP } from "../../utils/helpers";
import toast from "react-hot-toast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

const STATUS_FLOW = {
  placed: {
    next: "preparing",
    nextLabel: "👨‍🍳 Accept & Prepare",
    color: "#f97316",
  },
  preparing: {
    next: "out_for_delivery",
    nextLabel: "🛵 Send for Delivery",
    color: "#3b82f6",
  },
  out_for_delivery: {
    next: "delivered",
    nextLabel: "✅ Mark Delivered",
    color: "#22c55e",
  },
  delivered: { next: null, nextLabel: "Delivered", color: "#22c55e" },
  cancelled: { next: null, nextLabel: "Cancelled", color: "#ef4444" },
};

const TABS = [
  { key: "dashboard", icon: "📊", label: "Dashboard" },
  { key: "orders", icon: "📦", label: "Orders" },
  { key: "menu", icon: "🍔", label: "Menu Items" },
  { key: "analytics", icon: "📈", label: "Analytics" },
  { key: "customers", icon: "👥", label: "Customers" },
  { key: "delivery", icon: "🛵", label: "Delivery" },
  { key: "settings", icon: "⚙️", label: "Settings" },
];

const CHART_OPTIONS = {
  responsive: true,
  plugins: {
    legend: {
      labels: { color: "#9090a8", font: { family: "Cabinet Grotesk" } },
    },
  },
  scales: {
    x: {
      ticks: { color: "#9090a8" },
      grid: { color: "rgba(255,255,255,0.05)" },
    },
    y: {
      ticks: { color: "#9090a8" },
      grid: { color: "rgba(255,255,255,0.05)" },
    },
  },
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const prevOrderCount = useRef(0);

  // Settings state
  const [settings, setSettings] = useState({
    restaurantName: "QuickBite",
    restaurantOpen: true,
    deliveryFee: 0,
    taxRate: 8,
    minOrderAmount: 0,
    estimatedDeliveryTime: 30,
    currency: "USD",
    address: "",
    phone: "",
    email: "admin@quickbite.com",
    aboutText: "Premium food delivery service.",
    freeDeliveryAbove: 50,
    maxDeliveryRadius: 10,
  });

  // Profile pic state
  const [profilePic, setProfilePic] = useState(
    localStorage.getItem("admin_pic") || "",
  );
  const fileRef = useRef(null);

  if (user && user.role !== "admin") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 64 }}>🔒</div>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 28 }}>
          Admin Access Only
        </h2>
        <a href="/" className="btn-primary">
          Back to Menu
        </a>
      </div>
    );
  }

  // ── Data loaders ────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      setStats(await adminService.getStats());
    } catch {
      toast.error("Failed to load stats");
    }
  }, []);
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getOrders(orderFilter);
      // Check for new orders
      if (prevOrderCount.current > 0 && data.length > prevOrderCount.current) {
        const newCount = data.length - prevOrderCount.current;
        toast(`🔔 ${newCount} new order${newCount > 1 ? "s" : ""} arrived!`, {
          icon: "🍔",
          duration: 5000,
        });
        setNotifications((prev) =>
          [
            ...data.slice(0, newCount).map((o) => ({
              id: o._id,
              msg: `New order #${o._id.slice(-6).toUpperCase()} — ${fmt(o.total)}`,
              time: new Date(),
            })),
            ...prev,
          ].slice(0, 20),
        );
      }
      prevOrderCount.current = data.length;
      setOrders(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [orderFilter]);
  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      setMenuItems(await adminService.getMenuItems());
    } catch {
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, []);
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await adminService.getUsers());
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);
  useEffect(() => {
    if (tab === "dashboard") loadStats();
    else if (tab === "orders" || tab === "analytics") {
      loadOrders();
      loadStats();
    } else if (tab === "menu") loadMenu();
    else if (tab === "customers") loadUsers();
    else if (tab === "delivery") loadOrders();
  }, [tab, loadStats, loadOrders, loadMenu, loadUsers]);

  useEffect(() => {
    if (tab === "orders" || tab === "delivery") loadOrders();
  }, [orderFilter, loadOrders, tab]);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(() => {
      loadOrders();
      loadStats();
    }, 30000);
    return () => clearInterval(t);
  }, [loadOrders, loadStats]);

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      await adminService.updateStatus(orderId, newStatus);
      toast.success(`✅ Status → ${STATUS_MAP[newStatus]?.label}`);
      loadOrders();
      loadStats();
    } catch {
      toast.error("Failed to update");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const deleteMenuItem = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await adminService.deleteItem(id);
      toast.success("Deleted!");
      loadMenu();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleProfilePic = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfilePic(ev.target.result);
      localStorage.setItem("admin_pic", ev.target.result);
      toast.success("Profile picture updated!");
    };
    reader.readAsDataURL(file);
  };

  const filteredOrders = orders.filter((o) => {
    if (!orderSearch) return true;
    const s = orderSearch.toLowerCase();
    return (
      o._id.toLowerCase().includes(s) ||
      o.user?.name?.toLowerCase().includes(s) ||
      o.user?.email?.toLowerCase().includes(s)
    );
  });

  // ── Analytics data ──────────────────────────────────────────────────────────
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });

  const revenueByDay = last7Days.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toDateString();
    return orders
      .filter(
        (o) =>
          new Date(o.createdAt).toDateString() === dayStr &&
          o.status !== "cancelled",
      )
      .reduce((s, o) => s + o.total, 0);
  });

  const ordersByDay = last7Days.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return orders.filter(
      (o) => new Date(o.createdAt).toDateString() === d.toDateString(),
    ).length;
  });

  const categoryCount = menuItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const statusCount = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const topItems = [...menuItems]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  return (
    <div
      style={{ minHeight: "100vh", background: "var(--ink)", display: "flex" }}
    >
      {/* ── Sidebar ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 240,
          height: "100vh",
          background: "var(--ink-2)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
          overflowY: "auto",
        }}
      >
        {/* Profile */}
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid var(--border)",
            textAlign: "center",
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
                background: "linear-gradient(135deg, var(--brand), #fbbf24)",
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
                  alt="admin"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                "👨‍💼"
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
                border: "none",
                color: "#fff",
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✏️
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleProfilePic}
            />
          </div>
          <div
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: 15,
              fontWeight: 900,
              marginBottom: 2,
            }}
          >
            {user?.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--brand)",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Administrator
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {TABS.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                borderRadius: "var(--r-md)",
                border: "none",
                background:
                  tab === item.key ? "rgba(249,115,22,0.12)" : "transparent",
                color: tab === item.key ? "var(--brand)" : "var(--mist)",
                fontFamily: "Cabinet Grotesk, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 4,
                textAlign: "left",
                transition: "all 0.18s",
                position: "relative",
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
              {item.key === "orders" && stats?.pendingOrders > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "var(--brand)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 800,
                    minWidth: 20,
                    height: 20,
                    borderRadius: 99,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 5px",
                  }}
                >
                  {stats.pendingOrders}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div
          style={{
            padding: "16px 10px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            <button
              className="btn-ghost"
              style={{ width: "100%", padding: "9px", fontSize: 13 }}
            >
              🛍️ View Store
            </button>
          </a>
          <button
            onClick={logout}
            className="btn-ghost"
            style={{
              width: "100%",
              padding: "9px",
              fontSize: 13,
              color: "var(--danger)",
              borderColor: "rgba(239,68,68,0.3)",
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div
        style={{
          marginLeft: 240,
          flex: 1,
          padding: "32px",
          minHeight: "100vh",
          maxWidth: "calc(100vw - 240px)",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            marginBottom: 28,
            gap: 12,
          }}
        >
          <button
            onClick={() => {
              loadOrders();
              loadStats();
              toast("Refreshed!", { icon: "🔄" });
            }}
            className="btn-ghost"
            style={{ padding: "8px 16px", fontSize: 13 }}
          >
            🔄 Refresh
          </button>
          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotif((p) => !p)}
              style={{
                position: "relative",
                background: "var(--ink-3)",
                border: "1px solid var(--border-2)",
                borderRadius: 99,
                padding: "8px 16px",
                color: "var(--chalk)",
                cursor: "pointer",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "Cabinet Grotesk, sans-serif",
                fontWeight: 600,
              }}
            >
              🔔
              {notifications.length > 0 && (
                <span
                  style={{
                    background: "var(--danger)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 800,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 99,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                  }}
                >
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotif && (
              <div
                style={{
                  position: "absolute",
                  top: 44,
                  right: 0,
                  width: 320,
                  background: "var(--ink-2)",
                  border: "1px solid var(--border-2)",
                  borderRadius: "var(--r-lg)",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 200,
                  maxHeight: 360,
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: 14 }}>
                    Notifications
                  </span>
                  <button
                    onClick={() => {
                      setNotifications([]);
                      setShowNotif(false);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--mist)",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Clear all
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "var(--mist)",
                      fontSize: 13,
                    }}
                  >
                    No notifications
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--border)",
                        fontSize: 13,
                      }}
                    >
                      <p style={{ fontWeight: 600, marginBottom: 2 }}>
                        {n.msg}
                      </p>
                      <p style={{ color: "var(--mist)", fontSize: 11 }}>
                        {fmtTime(n.time)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ══ DASHBOARD ══ */}
        {tab === "dashboard" && (
          <div>
            <h1
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: 32,
                fontWeight: 900,
                marginBottom: 6,
              }}
            >
              Dashboard
            </h1>
            <p style={{ color: "var(--mist)", marginBottom: 28 }}>
              Welcome back, {user?.name}! Here's your overview.
            </p>

            {/* Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                gap: 14,
                marginBottom: 28,
              }}
            >
              {[
                {
                  label: "Total Orders",
                  value: stats?.totalOrders || 0,
                  icon: "📦",
                  color: "#f97316",
                },
                {
                  label: "Pending",
                  value: stats?.pendingOrders || 0,
                  icon: "⏳",
                  color: "#f59e0b",
                },
                {
                  label: "Delivering",
                  value: stats?.deliveringOrders || 0,
                  icon: "🛵",
                  color: "#3b82f6",
                },
                {
                  label: "Delivered",
                  value: stats?.deliveredOrders || 0,
                  icon: "✅",
                  color: "#22c55e",
                },
                {
                  label: "Cancelled",
                  value: stats?.cancelledOrders || 0,
                  icon: "❌",
                  color: "#ef4444",
                },
                {
                  label: "Total Revenue",
                  value: fmt(stats?.totalRevenue || 0),
                  icon: "💰",
                  color: "#a855f7",
                },
                {
                  label: "Customers",
                  value: stats?.totalUsers || 0,
                  icon: "👥",
                  color: "#06b6d4",
                },
                {
                  label: "Menu Items",
                  value: stats?.totalMenuItems || 0,
                  icon: "🍔",
                  color: "#f97316",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "var(--ink-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-lg)",
                    padding: "18px 20px",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-3px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{s.icon}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: s.color,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "Fraunces, serif",
                      fontSize: 26,
                      fontWeight: 900,
                      color: s.color,
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  background: "var(--ink-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                  padding: 24,
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>
                  📈 Revenue (Last 7 Days)
                </h3>
                <Bar
                  data={{
                    labels: last7Days,
                    datasets: [
                      {
                        label: "Revenue ($)",
                        data: revenueByDay,
                        backgroundColor: "rgba(249,115,22,0.7)",
                        borderRadius: 6,
                      },
                    ],
                  }}
                  options={CHART_OPTIONS}
                />
              </div>
              <div
                style={{
                  background: "var(--ink-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                  padding: 24,
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>
                  📦 Orders (Last 7 Days)
                </h3>
                <Line
                  data={{
                    labels: last7Days,
                    datasets: [
                      {
                        label: "Orders",
                        data: ordersByDay,
                        borderColor: "#f97316",
                        backgroundColor: "rgba(249,115,22,0.1)",
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: "#f97316",
                      },
                    ],
                  }}
                  options={CHART_OPTIONS}
                />
              </div>
            </div>

            {/* Recent orders */}
            <div
              style={{
                background: "var(--ink-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                padding: 24,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
                🕒 Recent Orders
              </h3>
              {(stats?.recentOrders || []).map((order) => (
                <div
                  key={order._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p style={{ color: "var(--mist)", fontSize: 12 }}>
                      {order.user?.name} · {fmtDate(order.createdAt)}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      className="badge"
                      style={{
                        background: `${STATUS_MAP[order.status]?.color}20`,
                        color: STATUS_MAP[order.status]?.color,
                      }}
                    >
                      {STATUS_MAP[order.status]?.label}
                    </span>
                    <p
                      style={{
                        color: "var(--brand)",
                        fontWeight: 700,
                        marginTop: 4,
                        fontSize: 14,
                      }}
                    >
                      {fmt(order.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ ORDERS ══ */}
        {tab === "orders" && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <h1
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontSize: 32,
                    fontWeight: 900,
                    marginBottom: 4,
                  }}
                >
                  Orders
                </h1>
                <p style={{ color: "var(--mist)", fontSize: 13 }}>
                  🔄 Auto-refreshes every 30s · {orders.length} total
                </p>
              </div>
              <input
                className="input"
                placeholder="🔍 Search by order ID or customer..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                style={{ width: 300, fontSize: 13 }}
              />
            </div>

            {/* Filter tabs */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 24,
                flexWrap: "wrap",
              }}
            >
              {[
                { key: "all", label: "All" },
                { key: "placed", label: "⏳ New" },
                { key: "preparing", label: "👨‍🍳 Preparing" },
                { key: "out_for_delivery", label: "🛵 Delivering" },
                { key: "delivered", label: "✅ Delivered" },
                { key: "cancelled", label: "❌ Cancelled" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setOrderFilter(f.key)}
                  className={`tag${orderFilter === f.key ? " active" : ""}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading ? (
              <LoadingBox />
            ) : filteredOrders.length === 0 ? (
              <EmptyBox emoji="📭" text="No orders found" />
            ) : (
              filteredOrders.map((order) => {
                const flow = STATUS_FLOW[order.status];
                const isUpdating = updatingOrder === order._id;
                return (
                  <div
                    key={order._id}
                    style={{
                      background: "var(--ink-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-lg)",
                      padding: 24,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: 14,
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: 6,
                          }}
                        >
                          <span style={{ fontWeight: 800, fontSize: 16 }}>
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                          <span
                            className="badge"
                            style={{
                              background: `${STATUS_MAP[order.status]?.color}20`,
                              color: STATUS_MAP[order.status]?.color,
                            }}
                          >
                            {STATUS_MAP[order.status]?.label}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--mist)" }}>
                            {order.paymentMethod?.toUpperCase()}
                          </span>
                        </div>
                        <p
                          style={{
                            color: "var(--mist)",
                            fontSize: 13,
                            marginBottom: 3,
                          }}
                        >
                          👤 {order.user?.name} · {order.user?.email} · 📱{" "}
                          {order.phone}
                        </p>
                        <p
                          style={{
                            color: "var(--mist)",
                            fontSize: 13,
                            marginBottom: 3,
                          }}
                        >
                          📍 {order.deliveryAddress?.street},{" "}
                          {order.deliveryAddress?.city}{" "}
                          {order.deliveryAddress?.zip}
                        </p>
                        <p style={{ color: "var(--mist)", fontSize: 13 }}>
                          🕒 {fmtDate(order.createdAt)} at{" "}
                          {fmtTime(order.createdAt)}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontFamily: "Fraunces, serif",
                            fontSize: 24,
                            fontWeight: 900,
                            color: "var(--brand)",
                          }}
                        >
                          {fmt(order.total)}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--mist)",
                            marginTop: 4,
                          }}
                        >
                          {order.items.length} item
                          {order.items.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div
                      style={{
                        background: "var(--ink-3)",
                        borderRadius: "var(--r-md)",
                        padding: "10px 14px",
                        marginBottom: 14,
                      }}
                    >
                      {order.items.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 13,
                            marginBottom: i < order.items.length - 1 ? 5 : 0,
                          }}
                        >
                          <span style={{ color: "var(--mist)" }}>
                            {item.emoji} {item.name} ×{item.quantity}
                          </span>
                          <span style={{ fontWeight: 600 }}>
                            {fmt(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {flow?.next && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order._id, flow.next)
                          }
                          disabled={isUpdating}
                          className="btn-primary"
                          style={{
                            padding: "9px 18px",
                            fontSize: 13,
                            background: flow.color,
                          }}
                        >
                          {isUpdating ? "⏳..." : flow.nextLabel}
                        </button>
                      )}
                      {!["cancelled", "delivered"].includes(order.status) && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order._id, "cancelled")
                          }
                          disabled={isUpdating}
                          className="btn-ghost"
                          style={{
                            padding: "9px 18px",
                            fontSize: 13,
                            color: "var(--danger)",
                            borderColor: "rgba(239,68,68,0.3)",
                          }}
                        >
                          ❌ Cancel
                        </button>
                      )}
                      <button
                        onClick={() => printReceipt(order)}
                        className="btn-ghost"
                        style={{ padding: "9px 18px", fontSize: 13 }}
                      >
                        🖨️ Print
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ══ MENU ══ */}
        {tab === "menu" && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <h1
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 32,
                  fontWeight: 900,
                }}
              >
                Menu Items{" "}
                <span
                  style={{
                    fontSize: 18,
                    color: "var(--mist)",
                    fontFamily: "Cabinet Grotesk, sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {menuItems.length} items
                </span>
              </h1>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowMenuForm(true);
                }}
                className="btn-primary"
                style={{ padding: "10px 22px" }}
              >
                + Add Item
              </button>
            </div>

            {showMenuForm && (
              <MenuItemForm
                item={editingItem}
                onSave={async (data) => {
                  try {
                    if (editingItem) {
                      await adminService.updateItem(editingItem._id, data);
                      toast.success("Item updated!");
                    } else {
                      await adminService.createItem(data);
                      toast.success("Item created!");
                    }
                    setShowMenuForm(false);
                    setEditingItem(null);
                    loadMenu();
                  } catch {
                    toast.error("Failed to save");
                  }
                }}
                onCancel={() => {
                  setShowMenuForm(false);
                  setEditingItem(null);
                }}
              />
            )}

            {/* Bulk actions */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={async () => {
                  if (window.confirm("Enable all items?")) {
                    await Promise.all(
                      menuItems.map((i) =>
                        adminService.updateItem(i._id, { isAvailable: true }),
                      ),
                    );
                    loadMenu();
                    toast.success("All items enabled!");
                  }
                }}
                className="btn-ghost"
                style={{ padding: "8px 16px", fontSize: 13 }}
              >
                ✅ Enable All
              </button>
              <button
                onClick={async () => {
                  if (window.confirm("Disable all items?")) {
                    await Promise.all(
                      menuItems.map((i) =>
                        adminService.updateItem(i._id, { isAvailable: false }),
                      ),
                    );
                    loadMenu();
                    toast.success("All items disabled!");
                  }
                }}
                className="btn-ghost"
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  color: "var(--danger)",
                  borderColor: "rgba(239,68,68,0.3)",
                }}
              >
                ⛔ Disable All
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {menuItems.map((item) => (
                <div
                  key={item._id}
                  style={{
                    background: "var(--ink-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-lg)",
                    overflow: "hidden",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-3px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  <div
                    style={{
                      height: 100,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 52,
                      background: "var(--ink-3)",
                      position: "relative",
                    }}
                  >
                    {item.emoji}
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        display: "flex",
                        gap: 4,
                      }}
                    >
                      {item.isPopular && (
                        <span
                          className="badge badge-brand"
                          style={{ fontSize: 10 }}
                        >
                          🔥
                        </span>
                      )}
                      <span
                        className="badge"
                        style={{
                          background: item.isAvailable
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(239,68,68,0.15)",
                          color: item.isAvailable
                            ? "var(--success)"
                            : "var(--danger)",
                          fontSize: 10,
                        }}
                      >
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <h3 style={{ fontWeight: 800, fontSize: 15 }}>
                        {item.name}
                      </h3>
                      <span
                        style={{
                          color: "var(--brand)",
                          fontWeight: 800,
                          fontFamily: "Fraunces, serif",
                        }}
                      >
                        {fmt(item.price)}
                      </span>
                    </div>
                    <p
                      style={{
                        color: "var(--mist)",
                        fontSize: 12,
                        marginBottom: 12,
                      }}
                    >
                      {item.category} · ⭐ {item.rating} · 🕒{" "}
                      {item.deliveryTime} min
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setShowMenuForm(true);
                        }}
                        className="btn-ghost"
                        style={{ flex: 1, padding: "7px", fontSize: 12 }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() =>
                          adminService
                            .updateItem(item._id, {
                              isAvailable: !item.isAvailable,
                            })
                            .then(loadMenu)
                        }
                        className="btn-ghost"
                        style={{ flex: 1, padding: "7px", fontSize: 12 }}
                      >
                        {item.isAvailable ? "⛔ Disable" : "✅ Enable"}
                      </button>
                      <button
                        onClick={() => deleteMenuItem(item._id, item.name)}
                        style={{
                          padding: "7px 10px",
                          fontSize: 12,
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          borderRadius: "var(--r-xl)",
                          color: "var(--danger)",
                          cursor: "pointer",
                          fontFamily: "Cabinet Grotesk, sans-serif",
                          fontWeight: 600,
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ ANALYTICS ══ */}
        {tab === "analytics" && (
          <div>
            <h1
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: 32,
                fontWeight: 900,
                marginBottom: 28,
              }}
            >
              Analytics
            </h1>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  background: "var(--ink-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                  padding: 24,
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>
                  💰 Revenue Last 7 Days
                </h3>
                <Bar
                  data={{
                    labels: last7Days,
                    datasets: [
                      {
                        label: "Revenue ($)",
                        data: revenueByDay,
                        backgroundColor: "rgba(249,115,22,0.7)",
                        borderRadius: 6,
                      },
                    ],
                  }}
                  options={CHART_OPTIONS}
                />
              </div>
              <div
                style={{
                  background: "var(--ink-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                  padding: 24,
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>
                  📦 Orders Last 7 Days
                </h3>
                <Line
                  data={{
                    labels: last7Days,
                    datasets: [
                      {
                        label: "Orders",
                        data: ordersByDay,
                        borderColor: "#f97316",
                        backgroundColor: "rgba(249,115,22,0.1)",
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: "#f97316",
                      },
                    ],
                  }}
                  options={CHART_OPTIONS}
                />
              </div>
              <div
                style={{
                  background: "var(--ink-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                  padding: 24,
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>
                  🍕 Menu by Category
                </h3>
                <Doughnut
                  data={{
                    labels: Object.keys(categoryCount),
                    datasets: [
                      {
                        data: Object.values(categoryCount),
                        backgroundColor: [
                          "#f97316",
                          "#3b82f6",
                          "#22c55e",
                          "#a855f7",
                          "#f59e0b",
                          "#06b6d4",
                          "#ef4444",
                          "#ec4899",
                        ],
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { labels: { color: "#9090a8" } } },
                  }}
                />
              </div>
              <div
                style={{
                  background: "var(--ink-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                  padding: 24,
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>
                  📊 Order Status Breakdown
                </h3>
                <Doughnut
                  data={{
                    labels: Object.keys(statusCount).map(
                      (k) => STATUS_MAP[k]?.label || k,
                    ),
                    datasets: [
                      {
                        data: Object.values(statusCount),
                        backgroundColor: [
                          "#f97316",
                          "#3b82f6",
                          "#22c55e",
                          "#ef4444",
                          "#f59e0b",
                        ],
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { labels: { color: "#9090a8" } } },
                  }}
                />
              </div>
            </div>

            {/* Top items */}
            <div
              style={{
                background: "var(--ink-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                padding: 24,
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
                ⭐ Top Rated Items
              </h3>
              {topItems.map((item, i) => (
                <div
                  key={item._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "10px 0",
                    borderBottom:
                      i < topItems.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: 24,
                      fontFamily: "Fraunces, serif",
                      fontWeight: 900,
                      color: "var(--brand)",
                      width: 30,
                    }}
                  >
                    #{i + 1}
                  </span>
                  <span style={{ fontSize: 28 }}>{item.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700 }}>{item.name}</p>
                    <p style={{ color: "var(--mist)", fontSize: 12 }}>
                      {item.category}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: "var(--brand)", fontWeight: 700 }}>
                      {fmt(item.price)}
                    </p>
                    <p style={{ color: "var(--mist)", fontSize: 12 }}>
                      ⭐ {item.rating}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Export */}
            <div
              style={{
                background: "var(--ink-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                padding: 24,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
                📥 Export Reports
              </h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => exportCSV(orders)}
                  className="btn-primary"
                  style={{ padding: "10px 20px", fontSize: 13 }}
                >
                  📊 Export Orders CSV
                </button>
                <button
                  onClick={() => exportCSV(users, "customers")}
                  className="btn-ghost"
                  style={{ padding: "10px 20px", fontSize: 13 }}
                >
                  👥 Export Customers CSV
                </button>
                <button
                  onClick={() => exportCSV(menuItems, "menu")}
                  className="btn-ghost"
                  style={{ padding: "10px 20px", fontSize: 13 }}
                >
                  🍔 Export Menu CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ CUSTOMERS ══ */}
        {tab === "customers" && (
          <div>
            <h1
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: 32,
                fontWeight: 900,
                marginBottom: 28,
              }}
            >
              Customers{" "}
              <span
                style={{
                  fontSize: 18,
                  color: "var(--mist)",
                  fontFamily: "Cabinet Grotesk, sans-serif",
                  fontWeight: 500,
                }}
              >
                {users.length} registered
              </span>
            </h1>
            <div
              style={{
                background: "var(--ink-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: "var(--ink-3)",
                    }}
                  >
                    {[
                      "Customer",
                      "Email",
                      "Phone",
                      "Joined",
                      "Orders",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "13px 18px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--mist)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const userOrders = orders.filter(
                      (o) => o.user?._id === u._id || o.user === u._id,
                    );
                    const totalSpent = userOrders.reduce(
                      (s, o) => s + o.total,
                      0,
                    );
                    return (
                      <tr
                        key={u._id}
                        style={{
                          borderBottom:
                            i < users.length - 1
                              ? "1px solid var(--border)"
                              : "none",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,0.02)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "13px 18px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                background:
                                  "linear-gradient(135deg, var(--brand), #fbbf24)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                                fontWeight: 900,
                                color: "#fff",
                                flexShrink: 0,
                              }}
                            >
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: 14 }}>
                                {u.name}
                              </p>
                              <p
                                style={{
                                  color: "var(--brand)",
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                {fmt(totalSpent)} spent
                              </p>
                            </div>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "13px 18px",
                            color: "var(--mist)",
                            fontSize: 13,
                          }}
                        >
                          {u.email}
                        </td>
                        <td
                          style={{
                            padding: "13px 18px",
                            color: "var(--mist)",
                            fontSize: 13,
                          }}
                        >
                          {u.phone || "—"}
                        </td>
                        <td
                          style={{
                            padding: "13px 18px",
                            color: "var(--mist)",
                            fontSize: 13,
                          }}
                        >
                          {fmtDate(u.createdAt)}
                        </td>
                        <td
                          style={{
                            padding: "13px 18px",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {userOrders.length}
                        </td>
                        <td style={{ padding: "13px 18px" }}>
                          <button
                            onClick={() => {
                              setOrderSearch(u.email);
                              setTab("orders");
                            }}
                            className="btn-ghost"
                            style={{ padding: "6px 12px", fontSize: 12 }}
                          >
                            View Orders
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {users.length === 0 && (
                <EmptyBox emoji="👥" text="No customers yet" />
              )}
            </div>
          </div>
        )}

        {/* ══ DELIVERY ══ */}
        {tab === "delivery" && (
          <div>
            <h1
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: 32,
                fontWeight: 900,
                marginBottom: 28,
              }}
            >
              Delivery Management
            </h1>

            {/* Active deliveries */}
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
              🛵 Active Deliveries
            </h2>
            {orders.filter((o) =>
              ["placed", "preparing", "out_for_delivery"].includes(o.status),
            ).length === 0 ? (
              <EmptyBox emoji="🎉" text="No active deliveries right now!" />
            ) : (
              orders
                .filter((o) =>
                  ["placed", "preparing", "out_for_delivery"].includes(
                    o.status,
                  ),
                )
                .map((order) => (
                  <div
                    key={order._id}
                    style={{
                      background: "var(--ink-2)",
                      border: `2px solid ${STATUS_MAP[order.status]?.color}33`,
                      borderRadius: "var(--r-lg)",
                      padding: 20,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 14,
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 6,
                          }}
                        >
                          <span style={{ fontWeight: 800, fontSize: 15 }}>
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                          <span
                            className="badge"
                            style={{
                              background: `${STATUS_MAP[order.status]?.color}20`,
                              color: STATUS_MAP[order.status]?.color,
                            }}
                          >
                            {STATUS_MAP[order.status]?.label}
                          </span>
                        </div>
                        <p
                          style={{
                            color: "var(--mist)",
                            fontSize: 13,
                            marginBottom: 2,
                          }}
                        >
                          👤 {order.user?.name} · 📱 {order.phone}
                        </p>
                        <p style={{ color: "var(--mist)", fontSize: 13 }}>
                          📍 {order.deliveryAddress?.street},{" "}
                          {order.deliveryAddress?.city}
                        </p>
                        <p style={{ color: "var(--mist)", fontSize: 13 }}>
                          🕒 Ordered at {fmtTime(order.createdAt)}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p
                          style={{
                            fontFamily: "Fraunces, serif",
                            fontSize: 20,
                            fontWeight: 900,
                            color: "var(--brand)",
                          }}
                        >
                          {fmt(order.total)}
                        </p>
                        <p style={{ color: "var(--mist)", fontSize: 12 }}>
                          {order.paymentMethod}
                        </p>
                      </div>
                    </div>

                    {/* Delivery partner */}
                    <div
                      style={{
                        background: "var(--ink-3)",
                        borderRadius: "var(--r-md)",
                        padding: "12px 16px",
                        marginBottom: 14,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--mist)",
                          fontWeight: 700,
                          marginBottom: 8,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        🛵 Delivery Partner
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, var(--brand), #fbbf24)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                          }}
                        >
                          👨
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 700 }}>Ravi Kumar</p>
                          <p style={{ color: "var(--mist)", fontSize: 12 }}>
                            ⭐ 4.9 · On the way
                          </p>
                        </div>
                        <button
                          className="btn-ghost"
                          style={{ padding: "6px 14px", fontSize: 12 }}
                        >
                          📞 Call
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {STATUS_FLOW[order.status]?.next && (
                        <button
                          onClick={() =>
                            updateOrderStatus(
                              order._id,
                              STATUS_FLOW[order.status].next,
                            )
                          }
                          disabled={updatingOrder === order._id}
                          className="btn-primary"
                          style={{
                            padding: "9px 18px",
                            fontSize: 13,
                            background: STATUS_FLOW[order.status].color,
                          }}
                        >
                          {updatingOrder === order._id
                            ? "⏳..."
                            : STATUS_FLOW[order.status].nextLabel}
                        </button>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {tab === "settings" && (
          <div>
            <h1
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: 32,
                fontWeight: 900,
                marginBottom: 28,
              }}
            >
              Settings
            </h1>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              {/* Restaurant */}
              <div className="section-card">
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>
                  🏪 Restaurant Info
                </h3>
                <SettingField
                  label="Restaurant Name"
                  value={settings.restaurantName}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, restaurantName: v }))
                  }
                />
                <SettingField
                  label="Address"
                  value={settings.address}
                  onChange={(v) => setSettings((s) => ({ ...s, address: v }))}
                />
                <SettingField
                  label="Phone"
                  value={settings.phone}
                  onChange={(v) => setSettings((s) => ({ ...s, phone: v }))}
                />
                <SettingField
                  label="Email"
                  value={settings.email}
                  onChange={(v) => setSettings((s) => ({ ...s, email: v }))}
                />
                <SettingField
                  label="About"
                  value={settings.aboutText}
                  onChange={(v) => setSettings((s) => ({ ...s, aboutText: v }))}
                  multiline
                />
              </div>

              {/* Operations */}
              <div className="section-card">
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>
                  ⚙️ Operations
                </h3>
                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--mist)",
                      marginBottom: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Restaurant Status
                  </label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() =>
                        setSettings((s) => ({ ...s, restaurantOpen: true }))
                      }
                      className={
                        settings.restaurantOpen ? "btn-primary" : "btn-ghost"
                      }
                      style={{ padding: "10px 20px", fontSize: 14 }}
                    >
                      🟢 Open
                    </button>
                    <button
                      onClick={() =>
                        setSettings((s) => ({ ...s, restaurantOpen: false }))
                      }
                      style={{
                        padding: "10px 20px",
                        fontSize: 14,
                        borderRadius: "var(--r-xl)",
                        border: "1px solid var(--border-2)",
                        background: !settings.restaurantOpen
                          ? "rgba(239,68,68,0.15)"
                          : "transparent",
                        color: !settings.restaurantOpen
                          ? "var(--danger)"
                          : "var(--mist)",
                        cursor: "pointer",
                        fontFamily: "Cabinet Grotesk, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      🔴 Closed
                    </button>
                  </div>
                </div>
                <SettingField
                  label="Estimated Delivery Time (min)"
                  value={settings.estimatedDeliveryTime}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, estimatedDeliveryTime: v }))
                  }
                  type="number"
                />
                <SettingField
                  label="Max Delivery Radius (km)"
                  value={settings.maxDeliveryRadius}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, maxDeliveryRadius: v }))
                  }
                  type="number"
                />
              </div>

              {/* Pricing */}
              <div className="section-card">
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>
                  💰 Pricing
                </h3>
                <SettingField
                  label="Delivery Fee ($)"
                  value={settings.deliveryFee}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, deliveryFee: v }))
                  }
                  type="number"
                />
                <SettingField
                  label="Tax Rate (%)"
                  value={settings.taxRate}
                  onChange={(v) => setSettings((s) => ({ ...s, taxRate: v }))}
                  type="number"
                />
                <SettingField
                  label="Minimum Order Amount ($)"
                  value={settings.minOrderAmount}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, minOrderAmount: v }))
                  }
                  type="number"
                />
                <SettingField
                  label="Free Delivery Above ($)"
                  value={settings.freeDeliveryAbove}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, freeDeliveryAbove: v }))
                  }
                  type="number"
                />
              </div>

              {/* Profile */}
              <div className="section-card">
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>
                  👤 Admin Profile
                </h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 24,
                    padding: 16,
                    background: "var(--ink-3)",
                    borderRadius: "var(--r-md)",
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, var(--brand), #fbbf24)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      overflow: "hidden",
                      border: "3px solid var(--brand)",
                    }}
                  >
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt="admin"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      "👨‍💼"
                    )}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, marginBottom: 4 }}>
                      {user?.name}
                    </p>
                    <p
                      style={{
                        color: "var(--mist)",
                        fontSize: 13,
                        marginBottom: 8,
                      }}
                    >
                      {user?.email}
                    </p>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="btn-ghost"
                      style={{ padding: "6px 14px", fontSize: 12 }}
                    >
                      📷 Change Photo
                    </button>
                  </div>
                </div>
                <SettingField
                  label="Display Name"
                  value={user?.name || ""}
                  onChange={() => {}}
                />
                <SettingField
                  label="Email"
                  value={user?.email || ""}
                  onChange={() => {}}
                />
                <div style={{ marginTop: 8 }}>
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
                    New Password
                  </label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Leave blank to keep current"
                  />
                </div>
              </div>

              {/* Notifications */}
              <div className="section-card" style={{ gridColumn: "1 / -1" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>
                  🔔 Notification Preferences
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 12,
                  }}
                >
                  {[
                    "New order arrives",
                    "Order delivered",
                    "Order cancelled",
                    "Low stock alert",
                    "New customer signup",
                    "Daily revenue report",
                  ].map((label) => (
                    <label
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 16px",
                        background: "var(--ink-3)",
                        borderRadius: "var(--r-md)",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      <input
                        type="checkbox"
                        defaultChecked={[
                          "New order arrives",
                          "Order delivered",
                          "Order cancelled",
                          "Daily revenue report",
                        ].includes(label)}
                        style={{
                          accentColor: "var(--brand)",
                          width: 16,
                          height: 16,
                        }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Save button */}
            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <button
                className="btn-primary"
                onClick={() => {
                  localStorage.setItem("qb_settings", JSON.stringify(settings));
                  toast.success("✅ Settings saved!");
                }}
                style={{ padding: "13px 32px", fontSize: 16 }}
              >
                💾 Save All Settings
              </button>
              <button
                className="btn-ghost"
                onClick={() => {
                  const s = localStorage.getItem("qb_settings");
                  if (s) setSettings(JSON.parse(s));
                  toast("Settings reset to last saved");
                }}
                style={{ padding: "13px 24px" }}
              >
                ↩️ Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function LoadingBox() {
  return (
    <div style={{ textAlign: "center", padding: 48, color: "var(--mist)" }}>
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid var(--ink-4)",
          borderTop: "3px solid var(--brand)",
          borderRadius: "50%",
          animation: "spin 0.75s linear infinite",
          margin: "0 auto 12px",
        }}
      />
      Loading...
    </div>
  );
}

function EmptyBox({ emoji, text }) {
  return (
    <div style={{ textAlign: "center", padding: 48, color: "var(--mist)" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</div>
      <p>{text}</p>
    </div>
  );
}

function SettingField({ label, value, onChange, type = "text", multiline }) {
  return (
    <div style={{ marginBottom: 16 }}>
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
      {multiline ? (
        <textarea
          className="input"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ resize: "vertical" }}
        />
      ) : (
        <input
          className="input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function MenuItemForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price || "",
    category: item?.category || "Burgers",
    emoji: item?.emoji || "🍽️",
    deliveryTime: item?.deliveryTime || "20-30",
    rating: item?.rating || 4.5,
    isPopular: item?.isPopular || false,
    isAvailable: item?.isAvailable !== false,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div
      style={{
        background: "var(--ink-3)",
        border: "1px solid var(--border-2)",
        borderRadius: "var(--r-lg)",
        padding: 24,
        marginBottom: 24,
      }}
    >
      <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>
        {item ? "✏️ Edit Item" : "➕ New Menu Item"}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SettingField
          label="Name *"
          value={form.name}
          onChange={(v) => set("name", v)}
        />
        <SettingField
          label="Emoji"
          value={form.emoji}
          onChange={(v) => set("emoji", v)}
        />
        <SettingField
          label="Price ($) *"
          value={form.price}
          onChange={(v) => set("price", v)}
          type="number"
        />
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
            Category *
          </label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {[
              "Burgers",
              "Pizza",
              "Asian",
              "Mexican",
              "Healthy",
              "Italian",
              "Desserts",
              "Drinks",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <SettingField
          label="Delivery Time"
          value={form.deliveryTime}
          onChange={(v) => set("deliveryTime", v)}
        />
        <SettingField
          label="Rating"
          value={form.rating}
          onChange={(v) => set("rating", v)}
          type="number"
        />
        <div style={{ gridColumn: "1 / -1" }}>
          <SettingField
            label="Description *"
            value={form.description}
            onChange={(v) => set("description", v)}
            multiline
          />
        </div>
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 24 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={form.isPopular}
              onChange={(e) => set("isPopular", e.target.checked)}
              style={{ accentColor: "var(--brand)" }}
            />{" "}
            🔥 Popular
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => set("isAvailable", e.target.checked)}
              style={{ accentColor: "var(--brand)" }}
            />{" "}
            ✅ Available
          </label>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button
          className="btn-primary"
          onClick={() =>
            onSave({
              ...form,
              price: parseFloat(form.price),
              rating: parseFloat(form.rating),
            })
          }
          style={{ padding: "11px 28px" }}
        >
          {item ? "Save Changes" : "Create Item"}
        </button>
        <button
          className="btn-ghost"
          onClick={onCancel}
          style={{ padding: "11px 22px" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function printReceipt(order) {
  const w = window.open("", "_blank");
  w.document.write(`
    <html><head><title>Receipt #${order._id.slice(-8).toUpperCase()}</title>
    <style>body{font-family:monospace;padding:20px;max-width:400px;margin:0 auto}h2{text-align:center}.item{display:flex;justify-content:space-between}.total{font-weight:bold;font-size:18px;border-top:2px solid #000;padding-top:8px;margin-top:8px}</style>
    </head><body>
    <h2>🔥 QuickBite</h2>
    <p>Order: #${order._id.slice(-8).toUpperCase()}</p>
    <p>Date: ${new Date(order.createdAt).toLocaleString()}</p>
    <p>Customer: ${order.user?.name}</p>
    <p>Phone: ${order.phone}</p>
    <p>Address: ${order.deliveryAddress?.street}, ${order.deliveryAddress?.city}</p>
    <hr/>
    ${order.items.map((i) => `<div class="item"><span>${i.emoji} ${i.name} x${i.quantity}</span><span>$${(i.price * i.quantity).toFixed(2)}</span></div>`).join("")}
    <hr/>
    <div class="item"><span>Subtotal</span><span>$${order.subtotal?.toFixed(2)}</span></div>
    <div class="item"><span>Tax</span><span>$${order.tax?.toFixed(2)}</span></div>
    <div class="item total"><span>TOTAL</span><span>$${order.total?.toFixed(2)}</span></div>
    <p>Payment: ${order.paymentMethod?.toUpperCase()}</p>
    <p style="text-align:center;margin-top:20px">Thank you for ordering! 🙏</p>
    <script>window.print()</script></body></html>
  `);
  w.document.close();
}

function exportCSV(data, type = "orders") {
  let csv = "";
  if (type === "orders") {
    csv = "Order ID,Customer,Email,Total,Status,Date\n";
    csv += data
      .map(
        (o) =>
          `#${o._id.slice(-8)},${o.user?.name || ""},${o.user?.email || ""},${o.total},${o.status},${fmtDate(o.createdAt)}`,
      )
      .join("\n");
  } else if (type === "customers") {
    csv = "Name,Email,Phone,Joined\n";
    csv += data
      .map(
        (u) => `${u.name},${u.email},${u.phone || ""},${fmtDate(u.createdAt)}`,
      )
      .join("\n");
  } else if (type === "menu") {
    csv = "Name,Category,Price,Rating,Available\n";
    csv += data
      .map(
        (i) =>
          `${i.name},${i.category},${i.price},${i.rating},${i.isAvailable}`,
      )
      .join("\n");
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quickbite-${type}-${Date.now()}.csv`;
  a.click();
  toast.success(`📥 ${type} exported!`);
}
