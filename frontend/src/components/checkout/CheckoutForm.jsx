import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useApp } from "../../context/AppContext";
import { orderService } from "../../services";
import { FieldLabel, ErrorMsg, GlobalError } from "../shared";
import { fmt } from "../../utils/helpers";
import { useCoupon } from "../payment/CouponInput";
import CouponInput from "../payment/CouponInput";
import OrderSuccessScreen from "../ui/OrderSuccessScreen";
import {
  LocationPicker,
  DeliveryAreaCheck,
  DeliveryLocationPicker,
} from "../map/MapFeatures";
import toast from "react-hot-toast";

const PAYMENT = [
  { key: "card", label: "💳 Card" },
  { key: "cash", label: "💵 Cash" },
  { key: "wallet", label: "🔮 Wallet" },
  { key: "upi", label: "📱 UPI" },
];

const TIME_SLOTS = [
  "ASAP (25–35 min)",
  "Today 12:00 PM",
  "Today 1:00 PM",
  "Today 2:00 PM",
  "Today 6:00 PM",
  "Today 7:00 PM",
  "Today 8:00 PM",
  "Tomorrow 12:00 PM",
];

const TIP_OPTIONS = [0, 1, 2, 5, 10];

export default function CheckoutForm() {
  const { items, subtotal, tax, total, clearCart } = useCart();
  const { addPoints } = useApp();
  const navigate = useNavigate();
  const {
    coupon,
    apply: applyCoupon,
    remove: removeCoupon,
    getDiscount,
  } = useCoupon();

  const [placing, setPlacing] = useState(false);
  const [payment, setPayment] = useState("card");
  const [globalErr, setGlobalErr] = useState("");
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [successOrder, setSuccessOrder] = useState(null);
  const [useMapPicker, setUseMapPicker] = useState(false);
  const [form, setForm] = useState({
    street: "",
    city: "",
    zip: "",
    phone: "",
    cardNum: "",
    expiry: "",
    cvv: "",
    upiId: "",
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  // GPS fills street/city/zip automatically
  const handleGPS = useCallback((street, city, zip) => {
    if (street) set("street", street);
    if (city) set("city", city);
    if (zip) set("zip", zip);
    toast.success("📍 Address auto-filled from GPS!");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Map picker fills address
  const handleMapSelect = useCallback((loc) => {
    if (loc.street) set("street", loc.street);
    if (loc.city) set("city", loc.city);
    if (loc.zip) set("zip", loc.zip);
    if (!loc.inRange)
      toast.error("⚠️ This area may be outside our delivery zone");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const discount = getDiscount(subtotal);
  const tipAmount = customTip ? parseFloat(customTip) || 0 : tip;
  const grandTotal = +(total - discount + tipAmount).toFixed(2);

  const validate = () => {
    const e = {};
    if (!form.street.trim()) e.street = "Address required";
    if (!form.city.trim()) e.city = "City required";
    if (!form.zip.trim()) e.zip = "ZIP required";
    if (!form.phone.trim()) e.phone = "Phone required";
    if (payment === "card") {
      if (!form.cardNum.trim()) e.cardNum = "Card number required";
      if (!form.expiry.trim()) e.expiry = "Expiry required";
      if (!form.cvv.trim()) e.cvv = "CVV required";
    }
    if (payment === "upi" && !form.upiId.trim()) e.upiId = "UPI ID required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setGlobalErr("");
    setPlacing(true);
    try {
      const order = await orderService.place({
        items: items.map((i) => ({
          menuItem: i.menuItem,
          quantity: i.quantity,
        })),
        deliveryAddress: {
          street: form.street,
          city: form.city,
          zip: form.zip,
        },
        phone: form.phone,
        paymentMethod: payment,
        scheduledTime: timeSlot,
        tip: tipAmount,
        coupon: coupon?.code,
        total: grandTotal,
      });
      await clearCart();
      setSuccessOrder(order);
    } catch (err) {
      setGlobalErr(err.response?.data?.message || "Failed to place order.");
    } finally {
      setPlacing(false);
    }
  };

  if (successOrder)
    return (
      <OrderSuccessScreen
        order={successOrder}
        onClose={() => navigate(`/orders/${successOrder._id}`)}
      />
    );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 28,
        alignItems: "start",
      }}
    >
      <div>
        <div className="section-card">
          {/* Header with toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>
              🏠 Delivery Details
            </h3>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setUseMapPicker(false)}
                className={`tag${!useMapPicker ? " active" : ""}`}
                style={{ fontSize: 12, padding: "5px 12px" }}
              >
                ✏️ Manual
              </button>
              <button
                onClick={() => setUseMapPicker(true)}
                className={`tag${useMapPicker ? " active" : ""}`}
                style={{ fontSize: 12, padding: "5px 12px" }}
              >
                🗺️ Map Picker
              </button>
            </div>
          </div>

          <GlobalError msg={globalErr} />

          {useMapPicker ? (
            /* Real OpenStreetMap picker */
            <DeliveryLocationPicker onSelect={handleMapSelect} />
          ) : (
            /* Manual form with GPS button */
            <>
              <LocationPicker onSelect={handleGPS} />
              <DeliveryAreaCheck address={`${form.street} ${form.city}`} />
            </>
          )}

          <Field
            label="Street Address *"
            placeholder="123 Main Street"
            value={form.street}
            onChange={(v) => set("street", v)}
            error={errors.street}
          />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Field
              label="City *"
              placeholder="New York"
              value={form.city}
              onChange={(v) => set("city", v)}
              error={errors.city}
            />
            <Field
              label="ZIP Code *"
              placeholder="10001"
              value={form.zip}
              onChange={(v) => set("zip", v)}
              error={errors.zip}
            />
          </div>
          <Field
            label="Phone *"
            placeholder="+1 555 000 0000"
            value={form.phone}
            onChange={(v) => set("phone", v)}
            error={errors.phone}
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
              🕒 Delivery Time
            </label>
            <select
              className="input"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment */}
        <div className="section-card">
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>
            💳 Payment
          </h3>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            {PAYMENT.map((m) => (
              <button
                key={m.key}
                onClick={() => setPayment(m.key)}
                className={`tag${payment === m.key ? " active" : ""}`}
                style={{ fontSize: 13 }}
              >
                {m.label}
              </button>
            ))}
          </div>
          {payment === "card" && (
            <>
              <Field
                label="Card Number"
                placeholder="1234 5678 9012 3456"
                value={form.cardNum}
                onChange={(v) => set("cardNum", v)}
                error={errors.cardNum}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <Field
                  label="Expiry"
                  placeholder="MM/YY"
                  value={form.expiry}
                  onChange={(v) => set("expiry", v)}
                  error={errors.expiry}
                />
                <Field
                  label="CVV"
                  placeholder="123"
                  value={form.cvv}
                  onChange={(v) => set("cvv", v)}
                  error={errors.cvv}
                />
              </div>
            </>
          )}
          {payment === "cash" && (
            <p style={{ color: "var(--mist)", fontSize: 14 }}>
              💵 Pay cash on delivery.
            </p>
          )}
          {payment === "wallet" && (
            <p style={{ color: "var(--mist)", fontSize: 14 }}>
              🔮 Balance:{" "}
              <strong style={{ color: "var(--success)" }}>$42.50</strong>
            </p>
          )}
          {payment === "upi" && (
            <Field
              label="UPI ID"
              placeholder="yourname@upi"
              value={form.upiId}
              onChange={(v) => set("upiId", v)}
              error={errors.upiId}
            />
          )}
        </div>

        {/* Tip */}
        <div className="section-card">
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
            🙏 Tip for Delivery Partner
          </h3>
          <p style={{ color: "var(--mist)", fontSize: 13, marginBottom: 14 }}>
            100% goes to your delivery partner
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            {TIP_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTip(t);
                  setCustomTip("");
                }}
                className={`tag${tip === t && !customTip ? " active" : ""}`}
                style={{ fontSize: 13 }}
              >
                {t === 0 ? "No tip" : `$${t}`}
              </button>
            ))}
          </div>
          <input
            className="input"
            type="number"
            placeholder="Custom amount ($)"
            value={customTip}
            onChange={(e) => {
              setCustomTip(e.target.value);
              setTip(0);
            }}
            style={{ fontSize: 14 }}
          />
        </div>
      </div>

      {/* Right — Summary */}
      <div style={{ position: "sticky", top: 84 }}>
        <div className="section-card">
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>
            🧾 Order Summary
          </h3>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
                fontSize: 14,
              }}
            >
              <span
                style={{
                  color: "var(--mist)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "65%",
                }}
              >
                {item.emoji} {item.name} ×{item.quantity}
              </span>
              <span style={{ fontWeight: 700, flexShrink: 0 }}>
                {fmt(item.price * item.quantity)}
              </span>
            </div>
          ))}
          <div className="divider" />
          {[
            ["Subtotal", fmt(subtotal), null],
            ["Tax (8%)", fmt(tax), null],
            ["Delivery", "FREE", "var(--success)"],
            ...(tipAmount > 0 ? [["Tip", fmt(tipAmount), null]] : []),
            ...(discount > 0
              ? [["Discount", `-${fmt(discount)}`, "var(--success)"]]
              : []),
          ].map(([l, v, c]) => (
            <div
              key={l}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                fontSize: 14,
              }}
            >
              <span style={{ color: "var(--mist)" }}>{l}</span>
              <span style={{ fontWeight: 600, color: c || "var(--chalk)" }}>
                {v}
              </span>
            </div>
          ))}
          <div className="divider" />
          <CouponInput
            subtotal={subtotal}
            coupon={coupon}
            onApply={applyCoupon}
            onRemove={removeCoupon}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 17 }}>Total</span>
            <span
              style={{
                fontWeight: 900,
                fontSize: 22,
                color: "var(--brand)",
                fontFamily: "Fraunces, serif",
              }}
            >
              {fmt(grandTotal)}
            </span>
          </div>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={placing || !items.length}
            style={{ width: "100%", padding: "15px", fontSize: 16 }}
          >
            {placing ? "⏳ Placing..." : `Place Order · ${fmt(grandTotal)}`}
          </button>
          {timeSlot !== TIME_SLOTS[0] && (
            <p
              style={{
                textAlign: "center",
                marginTop: 10,
                fontSize: 12,
                color: "var(--mist)",
              }}
            >
              🕒 {timeSlot}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, error, type = "text" }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <FieldLabel>{label}</FieldLabel>
      <input
        className="input"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <ErrorMsg msg={error} />
    </div>
  );
}
