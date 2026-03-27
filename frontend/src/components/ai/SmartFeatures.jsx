import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { fmt } from "../../utils/helpers";

// ── Dietary Tags ──────────────────────────────────────────────────────────────
export const DIETARY_TAGS = [
  {
    key: "vegan",
    label: "🌱 Vegan",
    color: "#22c55e",
    categories: ["Healthy"],
  },
  {
    key: "vegetarian",
    label: "🥦 Vegetarian",
    color: "#86efac",
    categories: ["Healthy", "Italian", "Pizza", "Desserts", "Drinks"],
  },
  {
    key: "gluten_free",
    label: "🌾 Gluten Free",
    color: "#fbbf24",
    categories: ["Healthy", "Asian"],
  },
  {
    key: "keto",
    label: "🥩 Keto",
    color: "#f97316",
    categories: ["Burgers", "Asian"],
  },
  {
    key: "low_cal",
    label: "🔥 Low Calorie",
    color: "#60a5fa",
    categories: ["Healthy", "Drinks"],
  },
  {
    key: "spicy",
    label: "🌶️ Spicy",
    color: "#ef4444",
    categories: ["Asian", "Mexican", "Burgers"],
  },
];

export function DietaryFilter({ active, onChange }) {
  return (
    <div
      style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
    >
      {DIETARY_TAGS.map((tag) => (
        <button
          key={tag.key}
          onClick={() => onChange(active === tag.key ? null : tag.key)}
          style={{
            padding: "6px 14px",
            borderRadius: 99,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "Cabinet Grotesk, sans-serif",
            transition: "all 0.2s",
            border: `1.5px solid ${active === tag.key ? tag.color : "var(--border-2)"}`,
            background: active === tag.key ? `${tag.color}20` : "transparent",
            color: active === tag.key ? tag.color : "var(--mist)",
          }}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}

// ── AI Recommendations ────────────────────────────────────────────────────────
export function AIRecommendations({ items, onAuthNeeded }) {
  const { favorites } = useApp();
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    if (!items.length) return;
    const popular = items.filter((i) => i.isPopular);
    const topRated = [...items].sort((a, b) => b.rating - a.rating).slice(0, 3);
    const favItems = items.filter((i) => favorites.includes(i._id));
    const favCats = [...new Set(favItems.map((i) => i.category))];
    const similar = favCats.length
      ? items
          .filter(
            (i) => favCats.includes(i.category) && !favorites.includes(i._id),
          )
          .slice(0, 2)
      : [];
    const all = [...new Set([...similar, ...popular, ...topRated])].slice(0, 4);
    setRecs(all);
  }, [items, favorites]);

  if (!recs.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "linear-gradient(135deg,#a855f7,#6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          🤖
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 800 }}>AI Picks For You</h3>
        <span
          style={{
            fontSize: 11,
            color: "var(--mist)",
            background: "var(--ink-3)",
            padding: "2px 8px",
            borderRadius: 99,
            fontWeight: 600,
          }}
        >
          Personalized
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {recs.map((item) => (
          <MiniCard key={item._id} item={item} onAuthNeeded={onAuthNeeded} />
        ))}
      </div>
    </div>
  );
}

// ── Order Again ───────────────────────────────────────────────────────────────
export function OrderAgainSection({ items, onAuthNeeded }) {
  const [recent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("qb_recent_items") || "[]");
    } catch {
      return [];
    }
  });

  const recentItems = items.filter((i) => recent.includes(i._id)).slice(0, 3);
  if (!recentItems.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: 18 }}>🔄</span>
        <h3 style={{ fontSize: 16, fontWeight: 800 }}>Order Again</h3>
        <span
          style={{
            fontSize: 11,
            color: "var(--mist)",
            background: "var(--ink-3)",
            padding: "2px 8px",
            borderRadius: 99,
            fontWeight: 600,
          }}
        >
          Recently ordered
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {recentItems.map((item) => (
          <MiniCard
            key={item._id}
            item={item}
            onAuthNeeded={onAuthNeeded}
            label="Reorder"
          />
        ))}
      </div>
    </div>
  );
}

// ── Trending Now ──────────────────────────────────────────────────────────────
export function TrendingSection({ items, onAuthNeeded }) {
  const trending = [...items]
    .sort((a, b) => b.rating - a.rating)
    .filter((i) => i.isPopular)
    .slice(0, 4);
  if (!trending.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: 18 }}>🔥</span>
        <h3 style={{ fontSize: 16, fontWeight: 800 }}>Trending Now</h3>
        <span
          style={{
            fontSize: 11,
            color: "var(--brand)",
            background: "rgba(249,115,22,0.1)",
            padding: "2px 8px",
            borderRadius: 99,
            fontWeight: 600,
          }}
        >
          Hot this week
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {trending.map((item, i) => (
          <MiniCard
            key={item._id}
            item={item}
            onAuthNeeded={onAuthNeeded}
            rank={i + 1}
          />
        ))}
      </div>
    </div>
  );
}

// ── Smart Search ──────────────────────────────────────────────────────────────
export function SmartSearch({ value, onChange, items }) {
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const MOODS = {
    hungry: ["Burgers", "Pizza"],
    healthy: ["Healthy"],
    spicy: ["Asian", "Mexican"],
    sweet: ["Desserts"],
    quick: [],
    "date night": ["Italian", "Pizza"],
    party: ["Burgers", "Asian", "Mexican"],
    comfort: ["Asian", "Italian"],
  };

  useEffect(() => {
    if (!value.trim() || !focused) {
      setSuggestions([]);
      return;
    }
    const q = value.toLowerCase();
    const mood = Object.keys(MOODS).find((m) => q.includes(m));

    if (mood) {
      const cats = MOODS[mood];
      const moodItems = items
        .filter((i) => cats.includes(i.category))
        .slice(0, 4);
      setSuggestions(moodItems.map((i) => ({ type: "item", item: i })));
      return;
    }

    const matched = items
      .filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q),
      )
      .slice(0, 5);
    setSuggestions(matched.map((i) => ({ type: "item", item: i })));
  }, [value, items, focused]);

  return (
    <div style={{ position: "relative", maxWidth: 520, flex: 1 }}>
      <div style={{ display: "flex" }}>
        <input
          className="input"
          style={{
            borderRadius: "var(--r-xl) 0 0 var(--r-xl)",
            borderRight: "none",
            fontSize: 14,
          }}
          placeholder="Search food, mood (hungry, spicy, healthy)..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
        />
        <button
          className="btn-primary"
          style={{
            borderRadius: "0 var(--r-xl) var(--r-xl) 0",
            padding: "0 20px",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          🔍
        </button>
      </div>

      {focused && suggestions.length > 0 && (
        <div
          className="anim-fade-up"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "var(--ink-2)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--shadow-lg)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={i}
              onClick={() => {
                onChange(s.item.name);
                setFocused(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                cursor: "pointer",
                borderBottom:
                  i < suggestions.length - 1
                    ? "1px solid var(--border)"
                    : "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--ink-3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span style={{ fontSize: 24 }}>{s.item.emoji}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{s.item.name}</p>
                <p style={{ color: "var(--mist)", fontSize: 12 }}>
                  {s.item.category} · {fmt(s.item.price)}
                </p>
              </div>
            </div>
          ))}
          <div
            style={{
              padding: "8px 16px",
              background: "var(--ink-3)",
              borderTop: "1px solid var(--border)",
            }}
          >
            <p style={{ fontSize: 11, color: "var(--mist)", fontWeight: 600 }}>
              💡 Try: "hungry", "spicy", "healthy", "sweet"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mini Card ─────────────────────────────────────────────────────────────────
function MiniCard({ item, onAuthNeeded, label, rank }) {
  const { addItem } = useCart(); // ✅ Fixed: was require()
  const { user } = useAuth(); // ✅ Fixed: was require()

  return (
    <div
      style={{
        flexShrink: 0,
        width: 160,
        background: "var(--ink-2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        transition: "transform 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.transform = "translateY(-3px)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div
        style={{
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          background: "linear-gradient(135deg,var(--ink-3),var(--ink-4))",
          position: "relative",
        }}
      >
        {item.emoji}
        {rank && (
          <span
            style={{
              position: "absolute",
              top: 6,
              left: 8,
              fontSize: 11,
              fontWeight: 900,
              color: "var(--brand)",
              fontFamily: "Fraunces, serif",
            }}
          >
            #{rank}
          </span>
        )}
      </div>
      <div style={{ padding: "10px 12px" }}>
        <p
          style={{
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
        </p>
        <p
          style={{
            color: "var(--brand)",
            fontWeight: 800,
            fontSize: 13,
            fontFamily: "Fraunces, serif",
            marginBottom: 8,
          }}
        >
          {fmt(item.price)}
        </p>
        <button
          onClick={() => {
            if (!user) {
              onAuthNeeded?.();
              return;
            }
            addItem?.(item);
          }}
          style={{
            width: "100%",
            padding: "6px",
            borderRadius: 8,
            border: "none",
            background: "var(--brand)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "Cabinet Grotesk, sans-serif",
          }}
        >
          {label || "+ Add"}
        </button>
      </div>
    </div>
  );
}
