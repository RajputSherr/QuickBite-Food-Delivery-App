import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ORDER_STEPS,
  STATUS_MAP,
  getStep,
  fmt,
  fmtDate,
  fmtTime,
} from "../../utils/helpers";
import { orderService } from "../../services";
import ReviewModal from "../reviews/ReviewModal";
import { LiveTrackingMap } from "../map/MapFeatures";
import toast from "react-hot-toast";

export function OrderTracker({ order: initialOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [showReview, setShowReview] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const currentStep = getStep(order.status);
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";
  const progressPct = isCancelled
    ? 0
    : (currentStep / (ORDER_STEPS.length - 1)) * 100;

  useEffect(() => {
    if (!order.estimatedDelivery || isDelivered || isCancelled) return;
    const update = () => {
      const diff = new Date(order.estimatedDelivery) - Date.now();
      if (diff <= 0) {
        setCountdown("Arriving now! 🚀");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins}m ${secs}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [order.estimatedDelivery, isDelivered, isCancelled]);

  const cancelOrder = async () => {
    if (!window.confirm("Cancel this order?")) return;
    setCancelling(true);
    try {
      const updated = await orderService.cancel(order._id);
      setOrder(updated);
      toast.success("Order cancelled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Cannot cancel at this stage");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div>
        {/* ── 🗺️ LIVE DELIVERY MAP ── */}
        <LiveTrackingMap order={order} />

        {/* Status hero */}
        <div
          style={{
            background: "var(--ink-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-xl)",
            padding: "36px 32px",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "var(--mist)",
              marginBottom: 8,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Order #{order._id.slice(-8).toUpperCase()}
          </p>
          <div style={{ fontSize: 60, marginBottom: 10 }}>
            {isCancelled ? "❌" : isDelivered ? "🏠" : "🛵"}
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>
            {STATUS_MAP[order.status]?.label || "Processing"}
          </h2>

          {!isCancelled && !isDelivered && countdown && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 20px",
                background: "rgba(249,115,22,0.1)",
                border: "1px solid rgba(249,115,22,0.2)",
                borderRadius: 99,
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>⏱️</span>
              <span
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 20,
                  fontWeight: 900,
                  color: "var(--brand)",
                }}
              >
                {countdown}
              </span>
            </div>
          )}
          {!isCancelled && !isDelivered && (
            <p style={{ color: "var(--mist)", fontSize: 14, marginBottom: 0 }}>
              Estimated delivery time
            </p>
          )}
          {isDelivered && (
            <p style={{ color: "var(--success)", fontSize: 15 }}>
              Delivered at {fmtTime(order.deliveredAt || order.updatedAt)} ·{" "}
              {fmtDate(order.deliveredAt || order.updatedAt)}
            </p>
          )}
          {isCancelled && (
            <p style={{ color: "var(--danger)", fontSize: 15 }}>
              This order was cancelled.
            </p>
          )}

          {!isCancelled && (
            <div
              style={{
                height: 5,
                background: "var(--ink-4)",
                borderRadius: 99,
                overflow: "hidden",
                margin: "24px 0 28px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg,var(--brand),#fbbf24)",
                  borderRadius: 99,
                  transition: "width 1s ease",
                }}
              />
            </div>
          )}

          {!isCancelled && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                textAlign: "left",
              }}
            >
              {ORDER_STEPS.map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                  <div
                    key={step.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 16px",
                      borderRadius: "var(--r-md)",
                      background: active
                        ? "rgba(249,115,22,0.08)"
                        : done
                          ? "rgba(34,197,94,0.05)"
                          : "transparent",
                      border: `1px solid ${active ? "rgba(249,115,22,0.25)" : done ? "rgba(34,197,94,0.15)" : "transparent"}`,
                      transition: "all 0.3s",
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 99,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        background: active
                          ? "rgba(249,115,22,0.15)"
                          : done
                            ? "rgba(34,197,94,0.12)"
                            : "var(--ink-3)",
                      }}
                    >
                      {done ? "✅" : step.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontWeight: 700,
                          fontSize: 15,
                          marginBottom: 2,
                        }}
                      >
                        {step.label}
                      </p>
                      <p style={{ color: "var(--mist)", fontSize: 12 }}>
                        {done ? "Completed" : active ? step.desc : "Upcoming"}
                      </p>
                    </div>
                    {active && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--brand)",
                          animation: "pulse 1.2s ease-in-out infinite",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              marginTop: 20,
              flexWrap: "wrap",
            }}
          >
            {isDelivered && (
              <button
                className="btn-primary"
                onClick={() => setShowReview(true)}
                style={{ padding: "10px 22px", fontSize: 14 }}
              >
                ⭐ Rate Order · +50 pts
              </button>
            )}
            {!["cancelled", "delivered"].includes(order.status) && (
              <button
                onClick={cancelOrder}
                disabled={cancelling}
                className="btn-ghost"
                style={{
                  padding: "10px 22px",
                  fontSize: 14,
                  color: "var(--danger)",
                  borderColor: "rgba(239,68,68,0.3)",
                }}
              >
                {cancelling ? "⏳ Cancelling..." : "❌ Cancel Order"}
              </button>
            )}
          </div>
        </div>

        {["preparing", "out_for_delivery"].includes(order.status) && (
          <div
            style={{
              background: "var(--ink-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              padding: 20,
              marginBottom: 20,
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "var(--mist)",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              🛵 Delivery Partner
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 99,
                  background: "linear-gradient(135deg,var(--brand),#fbbf24)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                👨
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 16 }}>
                  {order.deliveryPartner?.name || "Ravi Kumar"}
                </p>
                <p style={{ color: "var(--mist)", fontSize: 13 }}>
                  ⭐ {order.deliveryPartner?.rating || "4.9"} · 1,200+
                  deliveries
                </p>
              </div>
              <button
                className="btn-ghost"
                style={{ padding: "8px 16px", fontSize: 13 }}
              >
                📞 Call
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            background: "var(--ink-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: "20px 24px",
            marginBottom: 20,
          }}
        >
          <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>
            🧾 Items Ordered
          </p>
          {order.items.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
                fontSize: 14,
              }}
            >
              <span style={{ color: "var(--mist)" }}>
                {item.emoji} {item.name} ×{item.quantity}
              </span>
              <span style={{ fontWeight: 700 }}>
                {fmt(item.price * item.quantity)}
              </span>
            </div>
          ))}
          <div className="divider" />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            <span>Total Paid</span>
            <span
              style={{ color: "var(--brand)", fontFamily: "Fraunces, serif" }}
            >
              {fmt(order.total)}
            </span>
          </div>
        </div>

        {isDelivered && (
          <div
            style={{
              background: "var(--ink-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p style={{ fontWeight: 700, marginBottom: 2 }}>
                Enjoyed your order?
              </p>
              <p style={{ color: "var(--mist)", fontSize: 13 }}>
                Order the same items again in one click
              </p>
            </div>
            <button
              className="btn-primary"
              onClick={() => toast.success("🔄 Items added to cart!")}
              style={{ padding: "10px 20px", fontSize: 14, flexShrink: 0 }}
            >
              🔄 Reorder
            </button>
          </div>
        )}
      </div>

      {showReview && (
        <ReviewModal order={order} onClose={() => setShowReview(false)} />
      )}
    </>
  );
}

export function OrderCard({ order }) {
  const meta = STATUS_MAP[order.status] || {};
  const [showReview, setShowReview] = useState(false);
  return (
    <>
      <div
        style={{
          background: "var(--ink-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: "18px 22px",
          marginBottom: 14,
          transition: "border-color 0.2s, transform 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(249,115,22,0.25)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div>
            <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 3 }}>
              Order #{order._id.slice(-8).toUpperCase()}
            </p>
            <p style={{ color: "var(--mist)", fontSize: 13 }}>
              {fmtDate(order.createdAt)}
            </p>
          </div>
          <span
            className="badge"
            style={{ background: `${meta.color}20`, color: meta.color }}
          >
            {meta.label}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          {order.items.slice(0, 4).map((item, i) => (
            <span
              key={i}
              style={{
                background: "var(--ink-3)",
                borderRadius: 8,
                padding: "3px 9px",
                fontSize: 12,
                color: "var(--mist)",
              }}
            >
              {item.emoji} {item.name} ×{item.quantity}
            </span>
          ))}
          {order.items.length > 4 && (
            <span
              style={{
                background: "var(--ink-3)",
                borderRadius: 8,
                padding: "3px 9px",
                fontSize: 12,
                color: "var(--mist)",
              }}
            >
              +{order.items.length - 4} more
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span
            style={{
              fontWeight: 900,
              fontSize: 18,
              color: "var(--brand)",
              fontFamily: "Fraunces, serif",
            }}
          >
            {fmt(order.total)}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {order.status === "delivered" && (
              <button
                onClick={() => setShowReview(true)}
                className="btn-ghost"
                style={{ padding: "7px 14px", fontSize: 12 }}
              >
                ⭐ Rate
              </button>
            )}
            <Link
              to={`/orders/${order._id}`}
              style={{ textDecoration: "none" }}
            >
              <button
                className="btn-ghost"
                style={{ padding: "7px 14px", fontSize: 12 }}
              >
                Track →
              </button>
            </Link>
          </div>
        </div>
      </div>
      {showReview && (
        <ReviewModal order={order} onClose={() => setShowReview(false)} />
      )}
    </>
  );
}
