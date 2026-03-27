import React, { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Leaflet.js + OpenStreetMap — 100% Free, No API Key Required
// ─────────────────────────────────────────────────────────────────────────────

// Restaurant location — change to your actual restaurant coordinates
const RESTAURANT = { lat: 28.6139, lng: 77.209, name: "QuickBite Kitchen" };
const MAX_RADIUS_KM = 10;

// ── Load Leaflet dynamically ──────────────────────────────────────────────────
let leafletLoaded = false;
function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) {
      resolve();
      return;
    }
    if (leafletLoaded) {
      const t = setInterval(() => {
        if (window.L) {
          clearInterval(t);
          resolve();
        }
      }, 100);
      return;
    }
    leafletLoaded = true;

    // CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

// ── Haversine distance ────────────────────────────────────────────────────────
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Reverse geocode using free Nominatim ──────────────────────────────────────
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "en" } },
    );
    const data = await res.json();
    return {
      full: data.display_name || "",
      street:
        [data.address?.house_number, data.address?.road]
          .filter(Boolean)
          .join(" ") ||
        data.address?.road ||
        "",
      city:
        data.address?.city || data.address?.town || data.address?.village || "",
      zip: data.address?.postcode || "",
      country: data.address?.country || "",
    };
  } catch {
    return {
      full: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      street: "",
      city: "",
      zip: "",
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 1. GPS LOCATION PICKER — Real GPS + Real OpenStreetMap
// ════════════════════════════════════════════════════════════════════════════
export function DeliveryLocationPicker({ onSelect }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState("");
  const [inRange, setInRange] = useState(null);
  const [distance, setDistance] = useState(null);
  const [searchVal, setSearchVal] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const searchTimer = useRef(null);

  const checkRange = useCallback((lat, lng) => {
    const dist = getDistanceKm(RESTAURANT.lat, RESTAURANT.lng, lat, lng);
    setDistance(dist.toFixed(1));
    const ok = dist <= MAX_RADIUS_KM;
    setInRange(ok);
    return ok;
  }, []);

  const placeMarker = useCallback(
    async (lat, lng) => {
      const L = window.L;
      const map = mapInstance.current;
      if (!L || !map) return;

      if (markerRef.current) map.removeLayer(markerRef.current);

      // Custom delivery pin icon
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:36px;height:44px;position:relative">
        <div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:#f97316;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 3px 12px rgba(249,115,22,0.5)"></div>
        <div style="position:absolute;top:8px;left:8px;font-size:16px">📍</div>
      </div>`,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
      });

      markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
      map.setView([lat, lng], 15, { animate: true });

      const inR = checkRange(lat, lng);
      const geo = await reverseGeocode(lat, lng);
      setAddress(geo.full);
      onSelect?.({
        lat,
        lng,
        address: geo.full,
        street: geo.street,
        city: geo.city,
        zip: geo.zip,
        inRange: inR,
      });
    },
    [checkRange, onSelect],
  );

  useEffect(() => {
    loadLeaflet().then(() => {
      if (!mapRef.current || mapInstance.current) return;
      const L = window.L;

      const map = L.map(mapRef.current, {
        center: [RESTAURANT.lat, RESTAURANT.lng],
        zoom: 12,
        zoomControl: true,
      });

      // Dark styled OpenStreetMap tiles (free, no API key)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        },
      ).addTo(map);

      // Restaurant marker
      const restIcon = L.divIcon({
        className: "",
        html: `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#f97316,#fbbf24);display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid white;box-shadow:0 4px 12px rgba(249,115,22,0.5)">🍔</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      L.marker([RESTAURANT.lat, RESTAURANT.lng], { icon: restIcon })
        .addTo(map)
        .bindPopup(
          `<b>${RESTAURANT.name}</b><br>We deliver within ${MAX_RADIUS_KM}km`,
        );

      // Delivery radius circle
      circleRef.current = L.circle([RESTAURANT.lat, RESTAURANT.lng], {
        radius: MAX_RADIUS_KM * 1000,
        color: "#f97316",
        weight: 2,
        opacity: 0.7,
        fillColor: "#f97316",
        fillOpacity: 0.06,
      }).addTo(map);

      // Click to set location
      map.on("click", (e) => placeMarker(e.latlng.lat, e.latlng.lng));

      mapInstance.current = map;
      setLoading(false);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [placeMarker]);

  // Address search using Nominatim
  const handleSearch = (val) => {
    setSearchVal(val);
    clearTimeout(searchTimer.current);
    if (val.length < 3) {
      setSuggestions([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5`,
          { headers: { "Accept-Language": "en" } },
        );
        const data = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
    }, 400);
  };

  const selectSuggestion = (s) => {
    setSearchVal(s.display_name);
    setSuggestions([]);
    placeMarker(parseFloat(s.lat), parseFloat(s.lon));
  };

  // GPS detect
  const detectGPS = () => {
    if (!navigator.geolocation) {
      toast.error("GPS not supported");
      return;
    }
    setLocating(true);
    toast("🎯 Detecting your location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        placeMarker(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
        toast.success("📍 Location detected!");
      },
      () => {
        toast.error("Could not get location. Allow GPS access.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              className="input"
              style={{ paddingLeft: 40 }}
              placeholder="🔍 Search your delivery address..."
              value={searchVal}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 16,
              }}
            >
              📍
            </span>
          </div>
          <button
            onClick={detectGPS}
            disabled={locating}
            className="btn-primary"
            style={{
              padding: "0 16px",
              fontSize: 13,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {locating ? "⏳" : "🎯"} {locating ? "Finding..." : "Use GPS"}
          </button>
        </div>

        {/* Search suggestions dropdown */}
        {suggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 60,
              background: "var(--ink-2)",
              border: "1px solid var(--border-2)",
              borderRadius: "var(--r-md)",
              zIndex: 999,
              maxHeight: 220,
              overflowY: "auto",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => selectSuggestion(s)}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderBottom:
                    i < suggestions.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                  fontSize: 13,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--ink-3)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <span style={{ flexShrink: 0, marginTop: 1 }}>📍</span>
                <span style={{ color: "var(--chalk)", lineHeight: 1.4 }}>
                  {s.display_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real OpenStreetMap */}
      <div
        style={{
          position: "relative",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          border: "1px solid var(--border-2)",
        }}
      >
        <div ref={mapRef} style={{ width: "100%", height: 300 }} />
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--ink-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                border: "3px solid var(--ink-4)",
                borderTop: "3px solid var(--brand)",
                borderRadius: "50%",
                animation: "spin 0.75s linear infinite",
              }}
            />
            <p style={{ color: "var(--mist)", fontSize: 13 }}>Loading map...</p>
          </div>
        )}
        {/* Map hint */}
        {!loading && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              background: "rgba(12,12,15,0.85)",
              backdropFilter: "blur(8px)",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 11,
              color: "var(--chalk)",
              pointerEvents: "none",
            }}
          >
            📍 Click anywhere on map to set delivery location
          </div>
        )}
      </div>

      {/* Delivery range status */}
      {inRange !== null && (
        <div
          className="anim-fade-up"
          style={{
            marginTop: 10,
            padding: "12px 16px",
            borderRadius: "var(--r-md)",
            background: inRange ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${inRange ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 22 }}>{inRange ? "✅" : "❌"}</span>
          <div>
            <p
              style={{
                fontWeight: 700,
                color: inRange ? "var(--success)" : "var(--danger)",
                marginBottom: 2,
              }}
            >
              {inRange
                ? "🎉 We deliver to your location!"
                : "😕 Outside our delivery zone"}
            </p>
            <p style={{ color: "var(--mist)", fontSize: 12 }}>
              {distance}km from our kitchen · Max delivery: {MAX_RADIUS_KM}km
            </p>
          </div>
        </div>
      )}

      {/* Selected address */}
      {address && (
        <div
          style={{
            marginTop: 8,
            padding: "10px 14px",
            background: "var(--ink-3)",
            borderRadius: "var(--r-md)",
            fontSize: 13,
            color: "var(--mist)",
            display: "flex",
            gap: 8,
          }}
        >
          <span style={{ flexShrink: 0 }}>📍</span>
          <span style={{ wordBreak: "break-word" }}>{address}</span>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 2. LIVE TRACKING MAP — Real OpenStreetMap with animated rider
// ════════════════════════════════════════════════════════════════════════════
export function LiveTrackingMap({ order }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const riderMarker = useRef(null);
  const routeLine = useRef(null);
  const animTimer = useRef(null);
  const [eta, setEta] = useState(25);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!["preparing", "out_for_delivery"].includes(order?.status)) return;

    loadLeaflet().then(() => {
      if (!mapRef.current || mapInstance.current) return;
      const L = window.L;

      // Simulate destination near restaurant
      const destLat = RESTAURANT.lat + 0.04;
      const destLng = RESTAURANT.lng + 0.05;
      const midLat = (RESTAURANT.lat + destLat) / 2;
      const midLng = (RESTAURANT.lng + destLng) / 2;

      const map = L.map(mapRef.current, {
        center: [midLat, midLng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
          subdomains: "abcd",
          maxZoom: 19,
        },
      ).addTo(map);

      // Restaurant marker
      const restIcon = L.divIcon({
        className: "",
        html: `<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#f97316,#fbbf24);display:flex;align-items:center;justify-content:center;font-size:22px;border:3px solid white;box-shadow:0 4px 16px rgba(249,115,22,0.6)">🍔</div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      L.marker([RESTAURANT.lat, RESTAURANT.lng], { icon: restIcon })
        .addTo(map)
        .bindPopup("<b>QuickBite Kitchen</b><br>Your food is here!");

      // Destination marker
      const destIcon = L.divIcon({
        className: "",
        html: `<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#16a34a);display:flex;align-items:center;justify-content:center;font-size:22px;border:3px solid white;box-shadow:0 4px 16px rgba(34,197,94,0.6)">🏠</div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      L.marker([destLat, destLng], { icon: destIcon })
        .addTo(map)
        .bindPopup("<b>Your Location</b>");

      // Rider marker
      const riderIcon = L.divIcon({
        className: "",
        html: `<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#6366f1);display:flex;align-items:center;justify-content:center;font-size:24px;border:3px solid white;box-shadow:0 4px 16px rgba(59,130,246,0.6);animation:pulse 1s ease-in-out infinite">🛵</div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });
      riderMarker.current = L.marker([RESTAURANT.lat, RESTAURANT.lng], {
        icon: riderIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup("<b>Ravi Kumar</b><br>⭐ 4.9 · On the way!");

      // Route line
      const routePoints = [];
      const steps = 50;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const curveLat = Math.sin(t * Math.PI) * 0.008;
        routePoints.push([
          RESTAURANT.lat + (destLat - RESTAURANT.lat) * t + curveLat,
          RESTAURANT.lng + (destLng - RESTAURANT.lng) * t,
        ]);
      }

      routeLine.current = L.polyline(routePoints, {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.7,
        dashArray: order.status === "preparing" ? "8,8" : null,
      }).addTo(map);

      // Fit map to show both markers
      map.fitBounds(
        L.latLngBounds([
          [RESTAURANT.lat, RESTAURANT.lng],
          [destLat, destLng],
        ]).pad(0.2),
      );

      mapInstance.current = map;
      setLoaded(true);

      // Animate rider along route
      if (order.status === "out_for_delivery") {
        let step = 0;
        const startStep = Math.floor(steps * 0.15);
        step = startStep;

        const animate = () => {
          if (!riderMarker.current) return;
          if (step >= routePoints.length) {
            step = 0;
          }
          riderMarker.current.setLatLng(routePoints[step]);
          setEta(Math.max(1, Math.round((routePoints.length - step) * 0.35)));
          step++;
          animTimer.current = setTimeout(animate, 600);
        };
        animate();
      }
    });

    return () => {
      if (animTimer.current) clearTimeout(animTimer.current);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      riderMarker.current = null;
    };
  }, [order?.status]);

  if (!["preparing", "out_for_delivery"].includes(order?.status)) return null;

  return (
    <div
      style={{
        background: "var(--ink-2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        marginBottom: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#22c55e",
              animation: "pulse 1s ease-in-out infinite",
            }}
          />
          <span style={{ fontWeight: 800, fontSize: 15 }}>
            🗺️ Live Tracking
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--mist)",
              background: "var(--ink-3)",
              padding: "2px 8px",
              borderRadius: 99,
            }}
          >
            OpenStreetMap
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--mist)" }}>ETA:</span>
          <span
            style={{
              fontFamily: "Fraunces, serif",
              fontWeight: 900,
              color: "var(--brand)",
              fontSize: 20,
            }}
          >
            {eta} min
          </span>
        </div>
      </div>

      {/* Real Map */}
      <div style={{ position: "relative" }}>
        <div ref={mapRef} style={{ width: "100%", height: 300 }} />
        {!loaded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--ink-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                border: "3px solid var(--ink-4)",
                borderTop: "3px solid var(--brand)",
                borderRadius: "50%",
                animation: "spin 0.75s linear infinite",
              }}
            />
            <p style={{ color: "var(--mist)", fontSize: 13 }}>
              Loading live map...
            </p>
          </div>
        )}
      </div>

      {/* Rider info */}
      <div
        style={{
          padding: "12px 18px",
          background: "var(--ink-3)",
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
            background: "linear-gradient(135deg,#3b82f6,#6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          👨
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 14 }}>
            Ravi Kumar · 🛵{" "}
            {order.status === "out_for_delivery"
              ? "On the way!"
              : "Getting ready..."}
          </p>
          <p style={{ color: "var(--mist)", fontSize: 12 }}>
            ⭐ 4.9 · 1,200+ deliveries · Est. {eta} min away
          </p>
        </div>
        <button
          className="btn-ghost"
          style={{ padding: "7px 14px", fontSize: 12, flexShrink: 0 }}
        >
          📞 Call
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 3. GPS HOOK — for standalone GPS detection
// ════════════════════════════════════════════════════════════════════════════
export function useGPSLocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setError("GPS not supported on this browser");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const geo = await reverseGeocode(lat, lng);
        setLocation({ lat, lng, ...geo });
        toast.success("📍 Location detected!");
        setLoading(false);
      },
      (err) => {
        const msgs = {
          1: "Location access denied. Allow GPS in browser settings.",
          2: "Location unavailable.",
          3: "Request timed out.",
        };
        setError(msgs[err.code] || err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  return { location, loading, error, detect };
}

// ════════════════════════════════════════════════════════════════════════════
// 4. LOCATION PICKER BUTTON — simple GPS button for checkout form
// ════════════════════════════════════════════════════════════════════════════
export function LocationPicker({ onSelect }) {
  const { location, loading, error, detect } = useGPSLocation();

  useEffect(() => {
    if (location)
      onSelect?.(location.street || location.full, location.city, location.zip);
  }, [location, onSelect]);

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={detect}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "11px 16px",
          borderRadius: "var(--r-md)",
          border: "1.5px solid var(--border-2)",
          background: loading ? "var(--ink-3)" : "rgba(249,115,22,0.08)",
          color: loading ? "var(--mist)" : "var(--brand)",
          cursor: loading ? "default" : "pointer",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "Cabinet Grotesk, sans-serif",
          transition: "all 0.2s",
          width: "100%",
        }}
        onMouseEnter={(e) => {
          if (!loading)
            e.currentTarget.style.background = "rgba(249,115,22,0.15)";
        }}
        onMouseLeave={(e) => {
          if (!loading)
            e.currentTarget.style.background = "rgba(249,115,22,0.08)";
        }}
      >
        <span style={{ fontSize: 16 }}>{loading ? "⏳" : "🎯"}</span>
        {loading
          ? "Detecting your location..."
          : "Use My Current Location (GPS)"}
      </button>
      {error && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8,
            color: "var(--danger)",
            fontSize: 12,
          }}
        >
          ⚠ {error}
        </div>
      )}
      {location && !error && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 8,
            color: "var(--success)",
            fontSize: 12,
          }}
        >
          ✅ {location.full?.slice(0, 80)}...
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 5. DELIVERY AREA CHECK — real distance check
// ════════════════════════════════════════════════════════════════════════════
export function DeliveryAreaCheck({ address }) {
  const [status, setStatus] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    if (!address || address.trim().length < 5) {
      setStatus(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
          { headers: { "Accept-Language": "en" } },
        );
        const data = await res.json();
        if (data[0]) {
          const dist = getDistanceKm(
            RESTAURANT.lat,
            RESTAURANT.lng,
            parseFloat(data[0].lat),
            parseFloat(data[0].lon),
          );
          setDistance(dist.toFixed(1));
          setStatus(dist <= MAX_RADIUS_KM ? "available" : "unavailable");
        } else {
          setStatus("available"); // Default to available if can't check
        }
      } catch {
        setStatus("available");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [address]);

  if (!status) return null;

  return (
    <div
      className="anim-fade-up"
      style={{
        padding: "10px 14px",
        borderRadius: "var(--r-md)",
        marginBottom: 12,
        background:
          status === "available"
            ? "rgba(34,197,94,0.1)"
            : "rgba(239,68,68,0.1)",
        border: `1px solid ${status === "available" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ fontSize: 20 }}>
        {status === "available" ? "✅" : "❌"}
      </span>
      <div>
        <p
          style={{
            fontWeight: 700,
            color: status === "available" ? "var(--success)" : "var(--danger)",
            fontSize: 13,
            marginBottom: 2,
          }}
        >
          {status === "available"
            ? "🎉 We deliver to your area!"
            : "😕 Outside our delivery zone"}
        </p>
        <p style={{ color: "var(--mist)", fontSize: 12 }}>
          {distance ? `${distance}km from our kitchen · ` : ""}
          {status === "available"
            ? "Free delivery available!"
            : `Max delivery range: ${MAX_RADIUS_KM}km`}
        </p>
      </div>
    </div>
  );
}
