// ============================================================
// analytics.ts  –  Kidnapped AR Filter · Session Tracker
// ============================================================

// 🔧 PASTE YOUR GOOGLE APPS SCRIPT WEB-APP URL HERE:
const SHEET_URL = "https://script.google.com/macros/s/AKfycbyhy_6JQqdc9Hu_WWQN0-Ayr2mL7b5JDYBRsNu9GJ-vSx2UPE9pvTFPqs8PeO6bqitb/exec";

// Auto-flush after this many milliseconds (5 minutes)
const AUTO_FLUSH_MS = 5 * 60 * 1000;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export interface SessionData {
  sessionId: string;
  timestamp: string;
  ip: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  captureClicked: boolean;
  generateIdClicked: boolean;
  postIdClicked: boolean;
  watchKidnappedClicked: boolean;
}

// ─────────────────────────────────────────────────────────────
// Generate a unique session ID
// ─────────────────────────────────────────────────────────────
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `KID-${timestamp}-${random}`.toUpperCase();
}

// ─────────────────────────────────────────────────────────────
// Fetch the user's public IP
// ─────────────────────────────────────────────────────────────
async function fetchIP(): Promise<string | null> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Request geolocation
// ─────────────────────────────────────────────────────────────
function fetchLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 6000 }
    );
  });
}

// ─────────────────────────────────────────────────────────────
// Reverse-geocode coords → city name
// ─────────────────────────────────────────────────────────────
async function fetchCityName(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      null
    );
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Send session row to Google Sheets via image ping (no CORS)
// ─────────────────────────────────────────────────────────────
function sendToSheet(session: SessionData): void {
  if (!SHEET_URL || SHEET_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
    console.warn("[Analytics] SHEET_URL not set – data not sent.");
    return;
  }
  try {
    const params = new URLSearchParams({
      sessionId:             session.sessionId,
      timestamp:             session.timestamp,
      ip:                    session.ip                ?? "N/A",
      latitude:              session.latitude  != null ? String(session.latitude)  : "N/A",
      longitude:             session.longitude != null ? String(session.longitude) : "N/A",
      city:                  session.city              ?? "N/A",
      captureClicked:        session.captureClicked        ? "YES" : "NO",
      generateIdClicked:     session.generateIdClicked     ? "YES" : "NO",
      postIdClicked:         session.postIdClicked         ? "YES" : "NO",
      watchKidnappedClicked: session.watchKidnappedClicked ? "YES" : "NO",
    });
    const img = new Image();
    img.src = `${SHEET_URL}?${params.toString()}`;
  } catch (err) {
    console.error("[Analytics] Failed to send session:", err);
  }
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
}

// ─────────────────────────────────────────────────────────────
// Main Analytics class
// ─────────────────────────────────────────────────────────────
class Analytics {
  private session: SessionData;
  private flushed = false;
  private autoFlushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.session = {
      sessionId: generateSessionId(),
      timestamp: formatTimestamp(new Date()),
      ip: null,
      latitude: null,
      longitude: null,
      city: null,
      captureClicked: false,
      generateIdClicked: false,
      postIdClicked: false,
      watchKidnappedClicked: false,
    };

    this.init();
    this.startAutoFlush();

    // Send when tab goes hidden (phone lock, tab switch, browser close)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.flush();
    });
  }

  // Collect IP + location silently in background
  private async init() {
    const [ip, location] = await Promise.all([fetchIP(), fetchLocation()]);
    this.session.ip = ip;
    if (location) {
      this.session.latitude = location.lat;
      this.session.longitude = location.lng;
      this.session.city = await fetchCityName(location.lat, location.lng);
    }
  }

  // Auto-flush after 5 minutes — catches users who just leave
  // the tab open and walk away without closing it
  private startAutoFlush() {
    this.autoFlushTimer = setTimeout(() => {
      this.flush();
    }, AUTO_FLUSH_MS);
  }

  // ── Event trackers — only set flags, never send directly ────
  // Sending happens once: on tab hide OR after 5 min, whichever
  // comes first. This guarantees exactly one row per session.
  trackCapture() {
    this.session.captureClicked = true;
  }

  trackGenerateId() {
    this.session.generateIdClicked = true;
  }

  trackPostId() {
    this.session.postIdClicked = true;
  }

  trackWatchKidnapped() {
    this.session.watchKidnappedClicked = true;
    // Don't flush here — visibilitychange fires naturally when
    // they switch to the YouTube tab, which triggers flush anyway
  }

  // ── flush() — sends once and never again ────────────────────
  flush() {
    if (this.flushed) return;       // ← this is the key guard
    this.flushed = true;
    if (this.autoFlushTimer) {
      clearTimeout(this.autoFlushTimer);
      this.autoFlushTimer = null;
    }
    sendToSheet(this.session);
  }

  getSessionId() {
    return this.session.sessionId;
  }
}

// Singleton – import `analytics` anywhere in your app
export const analytics = new Analytics();
