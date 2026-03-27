import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { menuService, orderService } from "../services";
import { MenuGrid, CategoryFilter } from "../components/menu";
import CheckoutForm from "../components/checkout/CheckoutForm";
import { OrderTracker } from "../components/orders";
import { OrderCard } from "../components/orders";
import { Spinner } from "../components/shared";
import { BeautifulEmpty } from "../components/ui/EmptyStates";
import FilterPanel, { applyFilters } from "../components/filters/FilterPanel";
import { DIETARY_TAGS } from "../components/ai/SmartFeatures";
import {
  AIRecommendations,
  OrderAgainSection,
  TrendingSection,
  SmartSearch,
  DietaryFilter,
} from "../components/ai/SmartFeatures";
import {
  GroupOrderBanner,
  ReviewsFeed,
} from "../components/social/SocialFeatures";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useApp } from "../context/AppContext";
import AuthModal from "../components/auth/AuthModal";

// ── HomePage ──────────────────────────────────────────────────────────────────
export function HomePage() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const { vegMode, favorites, language } = useApp();

  const [allItems, setAllItems] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [activeSection, setActiveSection] = useState("menu"); // menu | reviews
  const [dietaryFilter, setDietaryFilter] = useState(null);
  const [filters, setFilters] = useState({
    sort: "default",
    priceRange: "all",
    rating: "all",
    time: "all",
    offers: false,
    popular: false,
    newOnly: false,
  });

  // Pull to refresh
  const startY = useRef(0);
  const [pullDist, setPullDist] = useState(0);

  useEffect(() => {
    menuService
      .getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const fetchItems = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const params = {};
        if (category !== "All") params.category = category;
        const data = await menuService.getItems(params);
        setAllItems(data);
      } catch {
        setError("Failed to load menu. Pull down to refresh.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category],
  );

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Pull to refresh handlers
  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    const dist = e.touches[0].clientY - startY.current;
    if (dist > 0 && window.scrollY === 0) setPullDist(Math.min(dist, 80));
  };
  const onTouchEnd = () => {
    if (pullDist > 60) {
      setRefreshing(true);
      fetchItems(true);
    }
    setPullDist(0);
  };

  // Apply dietary filter
  const dietaryFiltered = dietaryFilter
    ? allItems.filter((i) => {
        const tag = DIETARY_TAGS.find((t) => t.key === dietaryFilter);
        return tag ? tag.categories.includes(i.category) : true;
      })
    : allItems;

  const baseItems =
    activeTab === "favorites"
      ? dietaryFiltered.filter((i) => favorites.includes(i._id))
      : dietaryFiltered;

  const displayItems = applyFilters(baseItems, filters, vegMode, search);
  const offers = allItems.filter((i) => i.isPopular).slice(0, 3);

  const TRANSLATIONS = {
    en: {
      crave: "Crave it,",
      get_it: "get it",
      search: "Search burgers, sushi, pasta...",
      all_dishes: "All Dishes",
      all_items: "All Items",
      favorites: "Favorites",
    },
    hi: {
      crave: "मन करे,",
      get_it: "मंगाओ",
      search: "बर्गर, पिज्ज़ा खोजें...",
      all_dishes: "सभी व्यंजन",
      all_items: "सभी आइटम",
      favorites: "पसंदीदा",
    },
  };
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <div
      style={{ paddingTop: 68 }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {pullDist > 0 && (
        <div
          style={{
            position: "fixed",
            top: 68,
            left: 0,
            right: 0,
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: pullDist,
            background: "var(--ink-2)",
            transition: "height 0.1s",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--mist)",
              fontSize: 13,
              fontWeight: 600,
              transform: `rotate(${pullDist * 2}deg)`,
            }}
          >
            {refreshing ? "⏳" : pullDist > 60 ? "🔄" : "↓"}{" "}
            {refreshing
              ? "Refreshing..."
              : pullDist > 60
                ? "Release to refresh"
                : "Pull to refresh"}
          </div>
        </div>
      )}

      {/* Hero */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "clamp(40px,7vw,80px) 32px clamp(32px,5vw,56px)",
          background:
            "radial-gradient(ellipse 80% 60% at 60% 0%, rgba(249,115,22,0.12) 0%, transparent 70%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(249,115,22,0.06)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          {user && (
            <div
              className="anim-fade-up"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                background: "rgba(249,115,22,0.1)",
                border: "1px solid rgba(249,115,22,0.2)",
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--brand)",
                marginBottom: 20,
              }}
            >
              👋{" "}
              {language === "hi"
                ? `स्वागत है, ${user.name}!`
                : `Welcome back, ${user.name}!`}
            </div>
          )}
          <h1
            className="anim-fade-up delay-1"
            style={{
              fontSize: "clamp(38px,7vw,76px)",
              fontWeight: 900,
              lineHeight: 1.05,
              marginBottom: 16,
              maxWidth: 700,
            }}
          >
            {t.crave}{" "}
            <span className="gradient-text" style={{ fontStyle: "italic" }}>
              {t.get_it}
            </span>
            <span style={{ color: "var(--brand)" }}>.</span>
          </h1>
          <p
            className="anim-fade-up delay-2"
            style={{
              color: "var(--mist)",
              fontSize: "clamp(14px,2vw,18px)",
              marginBottom: 28,
              maxWidth: 480,
            }}
          >
            {language === "hi"
              ? "बेहतरीन रेस्टोरेंट से गरमागरम खाना आपके दरवाज़े पर।"
              : "Premium food from the best restaurants, delivered hot to your door."}
          </p>

          {/* Smart Search */}
          <div
            className="anim-fade-up delay-3"
            style={{ marginBottom: 28, maxWidth: 520 }}
          >
            <SmartSearch value={search} onChange={setSearch} items={allItems} />
          </div>

          <div
            className="anim-fade-up delay-4"
            style={{ display: "flex", gap: 24, flexWrap: "wrap" }}
          >
            {[
              ["500+", "Dishes"],
              ["4.9★", "Rating"],
              ["20min", "Avg Delivery"],
              ["Free", "Shipping"],
            ].map(([v, l]) => (
              <div key={l}>
                <div
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontSize: 20,
                    fontWeight: 900,
                    color: "var(--brand)",
                  }}
                >
                  {v}
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
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1164, margin: "0 auto", padding: "0 32px 80px" }}>
        {/* Group order banner */}
        {user && <GroupOrderBanner />}

        {/* Offers Banner */}
        {offers.length > 0 && !vegMode && activeTab === "all" && !search && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>
              🏷️ {language === "hi" ? "आज के ऑफ़र" : "Today's Offers"}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 12,
              }}
            >
              {offers.map((item) => (
                <div
                  key={item._id}
                  style={{
                    background:
                      "linear-gradient(135deg,rgba(249,115,22,0.12),rgba(251,191,36,0.08))",
                    border: "1px solid rgba(249,115,22,0.2)",
                    borderRadius: "var(--r-lg)",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 36, flexShrink: 0 }}>
                    {item.emoji}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}
                    >
                      {item.name}
                    </p>
                    <p
                      style={{
                        color: "var(--mist)",
                        fontSize: 12,
                        marginBottom: 4,
                      }}
                    >
                      ⭐ {item.rating} · {item.deliveryTime} min
                    </p>
                    <span
                      style={{
                        fontFamily: "Fraunces, serif",
                        fontWeight: 900,
                        color: "var(--brand)",
                        fontSize: 16,
                      }}
                    >
                      ${item.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI & Smart sections */}
        {!search && activeTab === "all" && (
          <>
            <AIRecommendations
              items={allItems}
              onAuthNeeded={() => setShowAuth(true)}
            />
            <OrderAgainSection
              items={allItems}
              onAuthNeeded={() => setShowAuth(true)}
            />
            <TrendingSection
              items={allItems}
              onAuthNeeded={() => setShowAuth(true)}
            />
          </>
        )}

        {/* Section tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            borderBottom: "1px solid var(--border)",
            paddingBottom: 12,
          }}
        >
          {[
            { key: "menu", label: "🍽️ Menu" },
            { key: "reviews", label: "💬 Reviews Feed" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              style={{
                padding: "8px 18px",
                borderRadius: 99,
                border: "none",
                background:
                  activeSection === s.key ? "var(--brand)" : "transparent",
                color: activeSection === s.key ? "#fff" : "var(--mist)",
                fontFamily: "Cabinet Grotesk, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {activeSection === "reviews" ? (
          <ReviewsFeed />
        ) : (
          <>
            {/* Menu tabs & controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { key: "all", label: `🍽️ ${t.all_items}` },
                  {
                    key: "favorites",
                    label: `❤️ ${t.favorites}${favorites.length > 0 ? ` (${favorites.length})` : ""}`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`tag${activeTab === tab.key ? " active" : ""}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {user && itemCount > 0 && (
                <Link to="/checkout" style={{ textDecoration: "none" }}>
                  <button
                    className="btn-primary"
                    style={{ padding: "8px 18px", fontSize: 13 }}
                  >
                    🛒 Cart ({itemCount}) →
                  </button>
                </Link>
              )}
            </div>

            {/* Dietary tags */}
            <DietaryFilter active={dietaryFilter} onChange={setDietaryFilter} />

            {/* Category filter */}
            <CategoryFilter
              categories={categories}
              active={category}
              onChange={setCategory}
            />

            {/* Advanced filters */}
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              totalItems={displayItems.length}
              vegMode={vegMode}
            />

            {/* Grid */}
            {activeTab === "favorites" && displayItems.length === 0 ? (
              <BeautifulEmpty type="favorites" />
            ) : (
              <MenuGrid
                items={displayItems}
                loading={loading}
                error={error}
                onAuthNeeded={() => setShowAuth(true)}
              />
            )}
          </>
        )}
      </div>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        initialMode="login"
      />
    </div>
  );
}

// ── CheckoutPage ──────────────────────────────────────────────────────────────
export function CheckoutPage() {
  const { user } = useAuth();
  const { items } = useCart();
  if (!user)
    return (
      <PageShell title="Checkout">
        <BeautifulEmpty type="cart" />
      </PageShell>
    );
  if (!items.length)
    return (
      <PageShell title="Checkout">
        <BeautifulEmpty type="cart" />
      </PageShell>
    );
  return (
    <PageShell
      title="Checkout"
      subtitle={`${items.length} item${items.length !== 1 ? "s" : ""} ready`}
    >
      <CheckoutForm />
    </PageShell>
  );
}

// ── OrdersPage ────────────────────────────────────────────────────────────────
export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    orderService
      .getOrders()
      .then(setOrders)
      .catch(() => setError("Failed to load orders."))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user)
    return (
      <PageShell title="My Orders">
        <BeautifulEmpty type="orders" />
      </PageShell>
    );
  return (
    <PageShell
      title="My Orders"
      subtitle={`${orders.length} order${orders.length !== 1 ? "s" : ""} placed`}
    >
      {loading && <Spinner />}
      {error && <BeautifulEmpty type="orders" />}
      {!loading && !error && orders.length === 0 && (
        <BeautifulEmpty type="orders" />
      )}
      {orders.map((order, i) => (
        <div
          key={order._id}
          className="anim-fade-up"
          style={{ animationDelay: `${i * 0.07}s` }}
        >
          <OrderCard order={order} />
        </div>
      ))}
    </PageShell>
  );
}

// ── OrderDetailPage ───────────────────────────────────────────────────────────
export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      setOrder(await orderService.getOrder(id));
    } catch {
      setError("Order not found.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);
  useEffect(() => {
    if (!order || ["delivered", "cancelled"].includes(order.status)) return;
    const t = setInterval(fetchOrder, 15000);
    return () => clearInterval(t);
  }, [order, fetchOrder]);

  if (loading)
    return (
      <PageShell title="Order Tracking">
        <Spinner />
      </PageShell>
    );
  if (error)
    return (
      <PageShell title="Order Tracking">
        <BeautifulEmpty type="orders" />
      </PageShell>
    );

  return (
    <PageShell
      title="Order Tracking"
      backTo="/orders"
      backLabel="← Back to Orders"
    >
      {!["delivered", "cancelled"].includes(order?.status) && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: "rgba(249,115,22,0.1)",
            border: "1px solid rgba(249,115,22,0.2)",
            borderRadius: 99,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--brand)",
            marginBottom: 20,
          }}
        >
          🔄 Auto-updating every 15s
        </div>
      )}
      <OrderTracker order={order} />
    </PageShell>
  );
}

// ── PageShell ─────────────────────────────────────────────────────────────────
function PageShell({ title, subtitle, backTo, backLabel, children }) {
  return (
    <div style={{ paddingTop: 68, minHeight: "100vh" }}>
      <div
        style={{ maxWidth: 920, margin: "0 auto", padding: "44px 32px 80px" }}
      >
        {backTo && (
          <Link
            to={backTo}
            style={{
              textDecoration: "none",
              color: "var(--mist)",
              fontSize: 14,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 24,
            }}
          >
            {backLabel}
          </Link>
        )}
        <h1
          className="anim-fade-up"
          style={{
            fontSize: 36,
            fontWeight: 900,
            marginBottom: subtitle ? 6 : 28,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="anim-fade-up delay-1"
            style={{ color: "var(--mist)", marginBottom: 28, fontSize: 15 }}
          >
            {subtitle}
          </p>
        )}
        <div className="anim-fade-up delay-2">{children}</div>
      </div>
    </div>
  );
}
