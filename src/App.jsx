import { supabase, BUCKET, getPublicUrl } from "./supabase";
import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

/* ─── Constants ─── */
const DEF_W = 320, DEF_H = 180, MIN_W = 60, MIN_H = 30;
const NOTE_W = 200, NOTE_H = 120;
const SNAP_DIST = 8, SNAP_GAP = 7;
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const TEXT_STYLES = {
  title: { fontSize: 56, fontWeight: 400, label: "Title", ff: "'DM Sans',system-ui,sans-serif", lh: 1.0,  ls: "-0.03em" },
  h1:    { fontSize: 36, fontWeight: 400, label: "H1",    ff: "'DM Sans',system-ui,sans-serif", lh: 1.1,  ls: "-0.02em" },
  h2:    { fontSize: 28, fontWeight: 400, label: "H2",    ff: "'DM Sans',system-ui,sans-serif", lh: 1.25, ls: "-0.01em" },
  h3:    { fontSize: 22, fontWeight: 400, label: "H3",    ff: "'DM Sans',system-ui,sans-serif", lh: 1.3,  ls: "normal" },
  body:  { fontSize: 15, fontWeight: 400, label: "Body",  ff: "'DM Sans',system-ui,sans-serif", lh: 1.5,  ls: "normal" },
};

/* ─── Themes ─── */
const themes = {
  dark: {
    bg: "#101012", text: "rgba(255,255,255,.85)", textMuted: "rgba(255,255,255,.5)", textDim: "rgba(255,255,255,.2)",
    surface: "rgba(255,255,255,.05)", surfaceSolid: "#151516", border: "rgba(255,255,255,.07)", borderHover: "rgba(255,255,255,.12)",
    accent: "rgba(100,160,255,.7)", accentBg: "rgba(100,160,255,.2)", accentText: "rgba(100,160,255,.9)",
    clipBg: "#0e0e0f", clipShadow: "0 2px 20px rgba(0,0,0,.55)",
    noteBg: "rgba(255,255,255,.04)", noteBorder: "rgba(255,255,255,.1)", noteText: "rgba(255,255,255,.55)", nodeColor: "rgba(255,255,255,.2)",
    barBg: "linear-gradient(180deg,rgba(16,16,18,.97) 55%,rgba(16,16,18,0))",
    toolBg: "rgba(21,21,22,.92)", toolBorder: "rgba(255,255,255,.06)",
    dot: "rgba(255,255,255,.12)", marquee: "rgba(100,160,255,.6)", marqueeFill: "rgba(100,160,255,.08)",
    dropBg: "rgba(60,120,255,.06)", dropBorder: "rgba(60,120,255,.35)",
    guide: "rgba(100,160,255,.5)", selectBorder: "rgba(100,160,255,.7)",
    delBg: "rgba(255,50,50,.65)", caret: "rgba(100,160,255,.8)",
    inputBg: "rgba(255,255,255,.07)", inputBorder: "rgba(100,160,255,.4)", inputText: "#ddd",
  },
  light: {
    bg: "#eeecea", text: "rgba(0,0,0,.8)", textMuted: "rgba(0,0,0,.45)", textDim: "rgba(0,0,0,.2)",
    surface: "rgba(0,0,0,.04)", surfaceSolid: "#fff", border: "rgba(0,0,0,.08)", borderHover: "rgba(0,0,0,.15)",
    accent: "rgba(60,100,200,.7)", accentBg: "rgba(60,100,200,.12)", accentText: "rgba(40,80,180,.9)",
    clipBg: "#fff", clipShadow: "0 2px 16px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.06)",
    noteBg: "#fff", noteBorder: "rgba(0,0,0,.1)", noteText: "rgba(0,0,0,.5)", nodeColor: "rgba(0,0,0,.18)",
    barBg: "linear-gradient(180deg,rgba(238,236,234,.97) 55%,rgba(238,236,234,0))",
    toolBg: "rgba(255,255,255,.92)", toolBorder: "rgba(0,0,0,.08)",
    dot: "rgba(0,0,0,.07)", marquee: "rgba(60,100,200,.5)", marqueeFill: "rgba(60,100,200,.06)",
    dropBg: "rgba(60,100,200,.04)", dropBorder: "rgba(60,100,200,.25)",
    guide: "rgba(60,100,200,.4)", selectBorder: "rgba(60,100,200,.6)",
    delBg: "rgba(220,50,50,.7)", caret: "rgba(60,100,200,.8)",
    inputBg: "rgba(0,0,0,.04)", inputBorder: "rgba(60,100,200,.35)", inputText: "#222",
  }
};
const ThemeCtx = createContext(themes.dark);
const useTheme = () => useContext(ThemeCtx);

/* ─── Icons ─── */
function IPlus() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>; }
function ITrash() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z"/></svg>; }
function IVol({ on }) { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h2l3-3v10L5 10H3a1 1 0 01-1-1V7a1 1 0 011-1z"/>{on && <path d="M11.5 4.5a5 5 0 010 7"/>}</svg>; }
function IZIn() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/><line x1="5" y1="7" x2="9" y2="7"/><line x1="7" y1="5" x2="7" y2="9"/></svg>; }
function IZOut() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/><line x1="5" y1="7" x2="9" y2="7"/></svg>; }
function IText() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h10M8 3v10M5.5 13h5"/></svg>; }
function INote() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><line x1="5" y1="5.5" x2="11" y2="5.5"/><line x1="5" y1="8" x2="11" y2="8"/><line x1="5" y1="10.5" x2="9" y2="10.5"/></svg>; }
function ISun() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1.5" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="14.5"/><line x1="1.5" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="14.5" y2="8"/></svg>; }
function IMoon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13.5 8.5a5.5 5.5 0 01-6-6 5.5 5.5 0 106 6z"/></svg>; }

const fmtTime = s => {
  if (!s || !isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
};

/* ─── Snap engines ─── */
function calcSnap(dragIds, rawX, rawY, dragW, dragH, all) {
  const others = all.filter(c => !dragIds.has(c.id));
  if (!others.length) return { x: rawX, y: rawY, guides: [] };
  let bDx = null, bDy = null, sX = rawX, sY = rawY;
  const guides = [];
  const dl = rawX, dr = rawX + dragW, dt = rawY, db = rawY + dragH;
  const dcx = rawX + dragW / 2, dcy = rawY + dragH / 2;
  for (const o of others) {
    const ol = o.x, or_ = o.x + o.w, ot = o.y, ob = o.y + o.h;
    const ocx = o.x + o.w / 2, ocy = o.y + o.h / 2;
    for (const c of [
      { d: dl, t: ol, s: ol }, { d: dr, t: or_, s: or_ - dragW },
      { d: dl, t: or_ + SNAP_GAP, s: or_ + SNAP_GAP }, { d: dr, t: ol - SNAP_GAP, s: ol - SNAP_GAP - dragW },
      { d: dcx, t: ocx, s: ocx - dragW / 2 }
    ]) { const dist = Math.abs(c.d - c.t); if (dist < SNAP_DIST && (bDx === null || dist < bDx)) { bDx = dist; sX = c.s; } }
    for (const c of [
      { d: dt, t: ot, s: ot }, { d: db, t: ob, s: ob - dragH },
      { d: dt, t: ob + SNAP_GAP, s: ob + SNAP_GAP }, { d: db, t: ot - SNAP_GAP, s: ot - SNAP_GAP - dragH },
      { d: dcy, t: ocy, s: ocy - dragH / 2 }
    ]) { const dist = Math.abs(c.d - c.t); if (dist < SNAP_DIST && (bDy === null || dist < bDy)) { bDy = dist; sY = c.s; } }
  }
  const sl = sX, sr = sX + dragW, st = sY, sb = sY + dragH, scx = sX + dragW / 2, scy = sY + dragH / 2;
  for (const o of others) {
    const ol = o.x, or_ = o.x + o.w, ot = o.y, ob = o.y + o.h, ocx = o.x + o.w / 2, ocy = o.y + o.h / 2;
    if (bDx !== null) {
      if (Math.abs(sl - ol) < 1) guides.push({ type: 'v', pos: ol, min: Math.min(st, ot), max: Math.max(sb, ob) });
      if (Math.abs(sr - or_) < 1) guides.push({ type: 'v', pos: or_, min: Math.min(st, ot), max: Math.max(sb, ob) });
      if (Math.abs(scx - ocx) < 1) guides.push({ type: 'v', pos: ocx, min: Math.min(st, ot), max: Math.max(sb, ob) });
    }
    if (bDy !== null) {
      if (Math.abs(st - ot) < 1) guides.push({ type: 'h', pos: ot, min: Math.min(sl, ol), max: Math.max(sr, or_) });
      if (Math.abs(sb - ob) < 1) guides.push({ type: 'h', pos: ob, min: Math.min(sl, ol), max: Math.max(sr, or_) });
      if (Math.abs(scy - ocy) < 1) guides.push({ type: 'h', pos: ocy, min: Math.min(sl, ol), max: Math.max(sr, or_) });
    }
  }
  return { x: sX, y: sY, guides };
}

function calcResizeSnap(cid, cx, cy, rW, rH, all, corner) {
  if (!corner) corner = "br";
  const others = all.filter(c => c.id !== cid);
  if (!others.length) return { w: rW, h: rH, guides: [] };
  let bDx = null, bDy = null, sW = rW, sH = rH;
  const guides = [];
  const mR = corner === "br" || corner === "tr", mL = corner === "bl" || corner === "tl";
  const mB = corner === "br" || corner === "bl", mT = corner === "tr" || corner === "tl";
  const rl = cx, rr = cx + rW, rt = cy, rb = cy + rH;
  for (const o of others) {
    const ol = o.x, or_ = o.x + o.w, ot = o.y, ob = o.y + o.h;
    if (mR) { for (const c of [{ d: rr, t: or_, s: or_ - cx }, { d: rr, t: ol, s: ol - cx }]) { const dist = Math.abs(c.d - c.t); if (dist < SNAP_DIST && c.s >= MIN_W && (bDx === null || dist < bDx)) { bDx = dist; sW = c.s; } } }
    if (mL) { for (const c of [{ d: rl, t: ol, s: rr - ol }, { d: rl, t: or_, s: rr - or_ }]) { const dist = Math.abs(c.d - c.t); if (dist < SNAP_DIST && c.s >= MIN_W && (bDx === null || dist < bDx)) { bDx = dist; sW = c.s; } } }
    if (mB) { for (const c of [{ d: rb, t: ob, s: ob - cy }, { d: rb, t: ot, s: ot - cy }]) { const dist = Math.abs(c.d - c.t); if (dist < SNAP_DIST && c.s >= MIN_H && (bDy === null || dist < bDy)) { bDy = dist; sH = c.s; } } }
    if (mT) { for (const c of [{ d: rt, t: ot, s: rb - ot }, { d: rt, t: ob, s: rb - ob }]) { const dist = Math.abs(c.d - c.t); if (dist < SNAP_DIST && c.s >= MIN_H && (bDy === null || dist < bDy)) { bDy = dist; sH = c.s; } } }
  }
  const sL = mL ? (rr - sW) : cx, sR = mR ? (cx + sW) : rr;
  const sT = mT ? (rb - sH) : cy, sB = mB ? (cy + sH) : rb;
  for (const o of others) {
    const ol = o.x, or_ = o.x + o.w, ot = o.y, ob = o.y + o.h;
    if (bDx !== null) {
      const e = mR ? sR : sL;
      if (Math.abs(e - or_) < 1) guides.push({ type: 'v', pos: or_, min: Math.min(sT, ot), max: Math.max(sB, ob) });
      if (Math.abs(e - ol) < 1) guides.push({ type: 'v', pos: ol, min: Math.min(sT, ot), max: Math.max(sB, ob) });
    }
    if (bDy !== null) {
      const e = mB ? sB : sT;
      if (Math.abs(e - ob) < 1) guides.push({ type: 'h', pos: ob, min: Math.min(sL, ol), max: Math.max(sR, or_) });
      if (Math.abs(e - ot) < 1) guides.push({ type: 'h', pos: ot, min: Math.min(sL, ol), max: Math.max(sR, or_) });
    }
  }
  return { w: sW, h: sH, guides };
}

/* ─── Trim Timeline ─── */
function TrimTimeline({ vRef, trimIn, trimOut, onTrim, duration }) {
  const barRef = useRef(null);
  const [ph, setPh] = useState(0);
  const raf = useRef(null);
  const tiR = useRef(trimIn), toR = useRef(trimOut), otR = useRef(onTrim);
  useEffect(() => { tiR.current = trimIn; }, [trimIn]);
  useEffect(() => { toR.current = trimOut; }, [trimOut]);
  useEffect(() => { otR.current = onTrim; }, [onTrim]);
  useEffect(() => {
    const v = vRef.current;
    if (!v || !duration) return;
    const t = () => { if (v.duration) setPh(v.currentTime / v.duration); raf.current = requestAnimationFrame(t); };
    raf.current = requestAnimationFrame(t);
    return () => cancelAnimationFrame(raf.current);
  }, [vRef, duration]);

  const startDrag = useCallback((e, which) => {
    e.preventDefault(); e.stopPropagation();
    const bar = barRef.current; if (!bar) return;
    const move = ev => {
      ev.preventDefault();
      const r = bar.getBoundingClientRect();
      let f = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      if (which === "in") { f = Math.min(f, toR.current - 0.02); otR.current(Math.max(0, f), toR.current); }
      else { f = Math.max(f, tiR.current + 0.02); otR.current(tiR.current, Math.min(1, f)); }
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  }, []);

  const barClick = useCallback(e => {
    if (e.target.closest("[data-handle]")) return;
    e.stopPropagation();
    const b = barRef.current, v = vRef.current;
    if (!b || !v || !v.duration) return;
    const r = b.getBoundingClientRect();
    v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * v.duration;
  }, [vRef]);

  const ip = trimIn * 100, op = trimOut * 100, pp = ph * 100;
  const hs = p => ({ position: "absolute", left: `${p}%`, top: -8, width: 16, height: 22, transform: "translateX(-8px)", cursor: "ew-resize", zIndex: 2, touchAction: "none", display: "flex", alignItems: "center", justifyContent: "center" });
  const hv = { width: 4, height: 10, borderRadius: 1.5, background: "rgba(255,255,255,.85)" };

  return (
    <div data-trim="true" style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 4px", height: 20 }} onClick={e => e.stopPropagation()}>
      <span style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(255,255,255,.35)", minWidth: 22, textAlign: "right", flexShrink: 0 }}>{duration ? fmtTime(trimIn * duration) : ""}</span>
      <div ref={barRef} onClick={barClick} style={{ position: "relative", flex: 1, height: 6, background: "rgba(255,255,255,.08)", borderRadius: 3, cursor: "pointer" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${ip}%`, background: "rgba(0,0,0,.45)", borderRadius: "3px 0 0 3px" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${100 - op}%`, background: "rgba(0,0,0,.45)", borderRadius: "0 3px 3px 0" }} />
        <div style={{ position: "absolute", left: `${ip}%`, right: `${100 - op}%`, top: 0, bottom: 0, background: "rgba(255,255,255,.35)", borderRadius: 3 }} />
        <div style={{ position: "absolute", left: `${pp}%`, top: -1, width: 1.5, height: 8, background: "#fff", borderRadius: 1, transform: "translateX(-0.75px)", opacity: .7 }} />
        <div data-handle="in" onPointerDown={e => startDrag(e, "in")} style={hs(ip)}><div style={hv} /></div>
        <div data-handle="out" onPointerDown={e => startDrag(e, "out")} style={hs(op)}><div style={hv} /></div>
      </div>
      <span style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(255,255,255,.35)", minWidth: 22, flexShrink: 0 }}>{duration ? fmtTime(trimOut * duration) : ""}</span>
    </div>
  );
}

/* ─── Shared resize hook (8 handles: 4 corners + 4 edges) ─── */
const HANDLES = [
  { key: "tl", cursor: "nwse-resize" },
  { key: "tr", cursor: "nesw-resize" },
  { key: "bl", cursor: "nesw-resize" },
  { key: "br", cursor: "nwse-resize" },
  { key: "t",  cursor: "ns-resize" },
  { key: "b",  cursor: "ns-resize" },
  { key: "l",  cursor: "ew-resize" },
  { key: "r",  cursor: "ew-resize" },
];

function useResize(clipId, posRef, arRef, zoomRef, resizeRef, resizeEndRef, minW, minH) {
  if (minW === undefined) minW = MIN_W;
  if (minH === undefined) minH = MIN_H;
  const handleRefs = useRef({});
  const [mounted, setMounted] = useState(0);

  // trigger re-run after first render so refs are populated
  useEffect(() => { setMounted(m => m + 1); }, []);

  useEffect(() => {
    const cleanups = [];
    for (const { key } of HANDLES) {
      const el = handleRefs.current[key];
      if (!el) continue;
      const onDown = e => {
        e.preventDefault(); e.stopPropagation();
        const sx = e.clientX, sy = e.clientY;
        const { x: px, y: py, w: pw, h: ph } = posRef.current;
        const ar = arRef.current;
        const onMv = ev => {
          ev.preventDefault();
          const z = zoomRef.current;
          const dx = (ev.clientX - sx) / z, dy = (ev.clientY - sy) / z;
          let nx = px, ny = py, nw = pw, nh = ph;
          if (key === "br") { nw = pw + dx; nh = ph + dy; }
          else if (key === "bl") { nx = px + dx; nw = pw - dx; nh = ph + dy; }
          else if (key === "tr") { ny = py + dy; nw = pw + dx; nh = ph - dy; }
          else if (key === "tl") { nx = px + dx; ny = py + dy; nw = pw - dx; nh = ph - dy; }
          else if (key === "r") { nw = pw + dx; }
          else if (key === "l") { nx = px + dx; nw = pw - dx; }
          else if (key === "b") { nh = ph + dy; }
          else if (key === "t") { ny = py + dy; nh = ph - dy; }

          if (ev.shiftKey && key.length === 2) {
            nw = Math.max(minW, nw); nh = Math.max(minH, nw / ar);
            if (key === "tl") { nx = px + pw - nw; ny = py + ph - nh; }
            else if (key === "tr") { ny = py + ph - nh; }
            else if (key === "bl") { nx = px + pw - nw; }
          } else {
            nw = Math.max(minW, nw); nh = Math.max(minH, nh);
            if (key === "tl" || key === "l") { nx = px + pw - nw; }
            if (key === "tl" || key === "t") { ny = py + ph - nh; }
            if (key === "bl") { nx = px + pw - nw; }
            if (key === "tr") { ny = py + ph - nh; }
          }
          const corner = key.length === 2 ? key : (key === "r" ? "br" : key === "l" ? "bl" : key === "b" ? "br" : "tr");
          resizeRef.current(clipId, nx, ny, nw, nh, corner);
        };
        const onUp = () => { resizeEndRef.current(); window.removeEventListener("pointermove", onMv); window.removeEventListener("pointerup", onUp); };
        window.addEventListener("pointermove", onMv); window.addEventListener("pointerup", onUp);
      };
      el.addEventListener("pointerdown", onDown);
      cleanups.push(() => el.removeEventListener("pointerdown", onDown));
    }
    return () => cleanups.forEach(fn => fn());
  }, [clipId, mounted]);
  return handleRefs;
}

/* ─── Resize Handles ─── */
function ResizeHandles({ handleRefs, active }) {
  // active=true means handles respond to pointer events
  const pe = active !== false ? "auto" : "none";
  const S = 14; // corner hit area
  const E = 10; // edge hit area
  const handles = [
    { key: "tl", style: { top: -S/2, left: -S/2, width: S, height: S, cursor: "nwse-resize" } },
    { key: "tr", style: { top: -S/2, right: -S/2, width: S, height: S, cursor: "nesw-resize" } },
    { key: "bl", style: { bottom: -S/2, left: -S/2, width: S, height: S, cursor: "nesw-resize" } },
    { key: "br", style: { bottom: -S/2, right: -S/2, width: S, height: S, cursor: "nwse-resize" } },
    { key: "t", style: { top: -E/2, left: S, right: S, height: E, cursor: "ns-resize" } },
    { key: "b", style: { bottom: -E/2, left: S, right: S, height: E, cursor: "ns-resize" } },
    { key: "l", style: { left: -E/2, top: S, bottom: S, width: E, cursor: "ew-resize" } },
    { key: "r", style: { right: -E/2, top: S, bottom: S, width: E, cursor: "ew-resize" } },
  ];
  return (
    <>
      {handles.map(({ key, style }) => (
        <div key={key} ref={el => { if (el) handleRefs.current[key] = el; }} data-resize="true"
          style={{ position: "absolute", ...style, zIndex: 10, touchAction: "none", pointerEvents: pe }} />
      ))}
    </>
  );
}

/* ─── Editable hook (shared by Note + Text) ─── */
function useEditable(containerRef, textRef, clipId, onUpdateText, placeholder) {
  const [editing, setEditing] = useState(false);
  const editingRef = useRef(false);
  const onUpdateRef = useRef(onUpdateText);
  const clipIdRef = useRef(clipId);
  const placeholderRef = useRef(placeholder);
  useEffect(() => { editingRef.current = editing; }, [editing]);
  useEffect(() => { onUpdateRef.current = onUpdateText; }, [onUpdateText]);
  useEffect(() => { clipIdRef.current = clipId; }, [clipId]);
  useEffect(() => { placeholderRef.current = placeholder; }, [placeholder]);

  const finish = useCallback(() => {
    if (!editingRef.current) return;
    setEditing(false);
    editingRef.current = false;
    if (textRef.current) {
      const text = textRef.current.innerText.trim();
      // if empty, restore placeholder
      if (!text && placeholderRef.current) {
        textRef.current.innerText = placeholderRef.current;
      }
      onUpdateRef.current(clipIdRef.current, text || placeholderRef.current || "");
    }
  }, []);

  const startEditing = useCallback(e => {
    e.stopPropagation();
    setEditing(true);
    editingRef.current = true;
    setTimeout(() => {
      if (textRef.current) {
        // clear if it's the placeholder
        if (placeholderRef.current && textRef.current.innerText.trim() === placeholderRef.current) {
          textRef.current.innerText = "";
        }
        textRef.current.focus();
        const s = window.getSelection();
        s.selectAllChildren(textRef.current);
        s.collapseToEnd();
      }
    }, 10);
  }, []);

  const onKeyDown = useCallback(e => {
    if (e.key === "Escape") { finish(); if (e.target) e.target.blur(); }
    e.stopPropagation();
  }, [finish]);

  useEffect(() => {
    if (!editing) return;
    const fn = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) finish();
    };
    const t = setTimeout(() => window.addEventListener("pointerdown", fn, true), 50);
    return () => { clearTimeout(t); window.removeEventListener("pointerdown", fn, true); };
  }, [editing, finish]);

  return { editing, startEditing, finish, onKeyDown };
}

/* ─── NoteBlock ─── */
function NoteBlock({ clip, zoom, selected, onPointerDown, onResize, onResizeEnd, onDelete, onUpdateText }) {
  const T = useTheme();
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const PLACEHOLDER = "Type a note...";
  const { editing, startEditing, finish, onKeyDown } = useEditable(containerRef, textRef, clip.id, onUpdateText, PLACEHOLDER);
  const isPlaceholder = clip.text === PLACEHOLDER && !editing;

  const posRef = useRef({ x: clip.x, y: clip.y, w: clip.w, h: clip.h });
  const arRef = useRef(clip.w / clip.h);
  const zoomRef = useRef(zoom);
  const resizeRef = useRef(onResize);
  const resizeEndRef = useRef(onResizeEnd);
  useEffect(() => { posRef.current = { x: clip.x, y: clip.y, w: clip.w, h: clip.h }; arRef.current = clip.w / clip.h; }, [clip.x, clip.y, clip.w, clip.h]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { resizeRef.current = onResize; }, [onResize]);
  useEffect(() => { resizeEndRef.current = onResizeEnd; }, [onResizeEnd]);
  const handleRefs = useResize(clip.id, posRef, arRef, zoomRef, resizeRef, resizeEndRef, 80, 40);

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const onDown = e => {
      if (e.button !== 0 || e.target.closest("[data-resize]") || editing) return;
      e.preventDefault(); e.stopPropagation();
      onPointerDown(clip.id, e);
    };
    el.addEventListener("pointerdown", onDown);
    return () => el.removeEventListener("pointerdown", onDown);
  }, [clip.id, onPointerDown, editing]);

  const selBorder = selected ? `0 0 0 2px ${T.selectBorder}` : (hovered || editing ? `0 0 0 1px ${T.borderHover}` : "none");

  // auto-grow: only when text content changes (typing), not during manual resize
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const grow = () => {
      const sh = el.scrollHeight;
      const currentH = posRef.current.h;
      if (sh > currentH) {
        onResize(clip.id, posRef.current.x, posRef.current.y, posRef.current.w, sh, "br");
      }
    };
    el.addEventListener("input", grow);
    return () => el.removeEventListener("input", grow);
  }, [clip.id]);

  return (
    <div ref={containerRef} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onDoubleClick={startEditing}
      style={{ position: "absolute", left: clip.x, top: clip.y, width: clip.w, minHeight: clip.h, zIndex: clip.z || 0, cursor: editing ? "text" : "grab", borderRadius: 10, border: `1px solid ${T.noteBorder}`, background: T.noteBg, boxShadow: selBorder, touchAction: "none", overflow: "visible" }}>

      <div ref={textRef} contentEditable={editing} suppressContentEditableWarning onBlur={finish} onKeyDown={editing ? onKeyDown : undefined}
        style={{ position: "relative", zIndex: 1, width: "100%", padding: "10px 14px", fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, lineHeight: 1.5, fontWeight: 400, color: isPlaceholder ? T.textDim : T.noteText, fontStyle: isPlaceholder ? "italic" : "normal", outline: "none", overflow: "visible", whiteSpace: "pre-wrap", wordBreak: "break-word", caretColor: T.caret, borderRadius: 10 }}>
        {clip.text}
      </div>

      {hovered && !editing && (
        <button onClick={e => { e.stopPropagation(); onDelete(clip.id); }}
          style={{ position: "absolute", top: -8, right: -8, pointerEvents: "all", background: T.delBg, border: "none", borderRadius: 3, color: "#fff", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}>
          <ITrash />
        </button>
      )}
      <ResizeHandles handleRefs={handleRefs} active={!editing} />
    </div>
  );
}

/* ─── TextBlock ─── */
function TextBlock({ clip, zoom, selected, onPointerDown, onResize, onResizeEnd, onDelete, onUpdateText, onUpdateStyle, onAutoHeight }) {
  const T = useTheme();
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const { editing, startEditing, finish, onKeyDown } = useEditable(containerRef, textRef, clip.id, onUpdateText);

  const posRef = useRef({ x: clip.x, y: clip.y, w: clip.w, h: clip.h });
  const arRef = useRef(clip.w / clip.h);
  const zoomRef = useRef(zoom);
  const resizeRef = useRef(onResize);
  const resizeEndRef = useRef(onResizeEnd);
  useEffect(() => { posRef.current = { x: clip.x, y: clip.y, w: clip.w, h: clip.h }; arRef.current = clip.w / clip.h; }, [clip.x, clip.y, clip.w, clip.h]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { resizeRef.current = onResize; }, [onResize]);
  useEffect(() => { resizeEndRef.current = onResizeEnd; }, [onResizeEnd]);
  const handleRefs = useResize(clip.id, posRef, arRef, zoomRef, resizeRef, resizeEndRef, 30, 14);

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const onDown = e => {
      if (e.button !== 0 || e.target.closest("[data-resize]") || e.target.closest("[data-toolbar]") || editing) return;
      e.preventDefault(); e.stopPropagation();
      onPointerDown(clip.id, e);
    };
    el.addEventListener("pointerdown", onDown);
    return () => el.removeEventListener("pointerdown", onDown);
  }, [clip.id, onPointerDown, editing]);

  const style = TEXT_STYLES[clip.textStyle || "title"];
  const selBorder = selected ? `0 0 0 2px ${T.selectBorder}` : (hovered || editing ? `0 0 0 1px ${T.borderHover}` : "none");

  // auto-fit: sync clip.h to actual rendered height of text
  const syncHeight = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const z = zoomRef.current;
    const realH = rect.height / z;
    if (realH > 0 && Math.abs(realH - posRef.current.h) > 2) {
      onAutoHeight(clip.id, realH);
    }
  }, [clip.id, onAutoHeight]);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.addEventListener("input", syncHeight);
    return () => el.removeEventListener("input", syncHeight);
  }, [clip.id, syncHeight]);

  // sync on mount and when style changes
  useEffect(() => { requestAnimationFrame(syncHeight); }, [clip.textStyle, clip.w, syncHeight]);

  return (
    <div ref={containerRef} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onDoubleClick={startEditing}
      style={{ position: "absolute", left: clip.x, top: clip.y, width: clip.w, zIndex: clip.z || 0, cursor: editing ? "text" : "grab", borderRadius: 4, boxShadow: selBorder, touchAction: "none", overflow: "visible" }}>

      {selected && !editing && (
        <div data-toolbar="true" style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, display: "flex", gap: 2, background: T.surfaceSolid, border: `1px solid ${T.border}`, borderRadius: 6, padding: 2, zIndex: 20, pointerEvents: "all" }}>
          {Object.entries(TEXT_STYLES).map(([k, s]) => (
            <button key={k} onClick={e => { e.stopPropagation(); onUpdateStyle(clip.id, k); }}
              style={{ background: (clip.textStyle || "title") === k ? T.accentBg : "transparent", border: "none", borderRadius: 4, color: (clip.textStyle || "title") === k ? T.accentText : T.textMuted, padding: "3px 8px", fontSize: 10.5, fontFamily: "'Courier New',monospace", fontWeight: 600, cursor: "pointer" }}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div ref={textRef} contentEditable={editing} suppressContentEditableWarning onBlur={finish} onKeyDown={editing ? onKeyDown : undefined}
        style={{ position: "relative", zIndex: 1, width: "100%", fontFamily: style.ff, fontSize: style.fontSize, lineHeight: style.lh, fontWeight: style.fontWeight, letterSpacing: style.ls, color: T.text, outline: "none", overflow: "visible", whiteSpace: "pre-wrap", wordBreak: "break-word", padding: "2px 4px", background: editing ? T.surface : "transparent", borderRadius: 4, caretColor: T.caret }}>
        {clip.text}
      </div>

      {hovered && !editing && (
        <button onClick={e => { e.stopPropagation(); onDelete(clip.id); }}
          style={{ position: "absolute", top: -8, right: -8, pointerEvents: "all", background: T.delBg, border: "none", borderRadius: 3, color: "#fff", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}>
          <ITrash />
        </button>
      )}
      <ResizeHandles handleRefs={handleRefs} active={!editing} />
    </div>
  );
}

/* ─── ImageClip ─── */
function ImageClip({ clip, zoom, selected, onPointerDown, onResize, onResizeEnd, onDelete }) {
  const T = useTheme();
  const containerRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const arRef = useRef(16 / 9);
  const posRef = useRef({ x: clip.x, y: clip.y, w: clip.w, h: clip.h });
  const zoomRef = useRef(zoom);
  const resizeRef = useRef(onResize);
  const resizeEndRef = useRef(onResizeEnd);

  useEffect(() => { posRef.current = { x: clip.x, y: clip.y, w: clip.w, h: clip.h }; }, [clip.x, clip.y, clip.w, clip.h]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { resizeRef.current = onResize; }, [onResize]);
  useEffect(() => { resizeEndRef.current = onResizeEnd; }, [onResizeEnd]);
  const handleRefs = useResize(clip.id, posRef, arRef, zoomRef, resizeRef, resizeEndRef);

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const onDown = e => {
      if (e.button !== 0 || e.target.closest("[data-resize]")) return;
      e.preventDefault(); e.stopPropagation();
      onPointerDown(clip.id, e);
    };
    el.addEventListener("pointerdown", onDown);
    return () => el.removeEventListener("pointerdown", onDown);
  }, [clip.id, onPointerDown]);

  const onImgLoad = e => {
    const img = e.target;
    if (img.naturalWidth && img.naturalHeight) arRef.current = img.naturalWidth / img.naturalHeight;
    setLoaded(true);
  };

  const selB = selected ? `${T.clipShadow}, 0 0 0 2px ${T.selectBorder}` : `${T.clipShadow}, 0 0 0 1px ${T.border}`;

  return (
    <div ref={containerRef} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position: "absolute", left: clip.x, top: clip.y, width: clip.w, height: clip.h, zIndex: clip.z || 0, cursor: "grab", borderRadius: 6, overflow: "hidden", boxShadow: selB, background: T.clipBg, touchAction: "none" }}>
      <img src={clip.blobUrl} onLoad={onImgLoad} draggable={false}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
      {!loaded && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.3)", zIndex: 2, pointerEvents: "none" }}>
          <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,.1)", borderTopColor: "rgba(255,255,255,.5)", borderRadius: "50%", animation: "vbs .7s linear infinite" }} />
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", opacity: hovered ? 1 : 0, transition: "opacity .15s", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ background: "linear-gradient(180deg,rgba(0,0,0,.45) 0%,transparent 100%)", padding: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,.5)", background: "rgba(0,0,0,.4)", padding: "1px 5px", borderRadius: 3, maxWidth: "72%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clip.name}</span>
            <button onClick={e => { e.stopPropagation(); onDelete(clip.id); }} style={{ pointerEvents: "all", background: T.delBg, border: "none", borderRadius: 3, color: "#fff", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ITrash /></button>
          </div>
        </div>
      </div>
      <ResizeHandles handleRefs={handleRefs} />
    </div>
  );
}

/* ─── VideoClip ─── */
function VideoClip({ clip, zoom, selected, onPointerDown, onResize, onResizeEnd, onDelete, onTrim }) {
  const T = useTheme();
  const containerRef = useRef(null);
  const vRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [err, setErr] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [duration, setDuration] = useState(0);
  const arRef = useRef(16 / 9);
  const posRef = useRef({ x: clip.x, y: clip.y, w: clip.w, h: clip.h });
  const zoomRef = useRef(zoom);
  const resizeRef = useRef(onResize);
  const resizeEndRef = useRef(onResizeEnd);
  const trimRef = useRef({ trimIn: clip.trimIn || 0, trimOut: clip.trimOut || 1 });

  useEffect(() => { posRef.current = { x: clip.x, y: clip.y, w: clip.w, h: clip.h }; }, [clip.x, clip.y, clip.w, clip.h]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { resizeRef.current = onResize; }, [onResize]);
  useEffect(() => { resizeEndRef.current = onResizeEnd; }, [onResizeEnd]);
  useEffect(() => { trimRef.current = { trimIn: clip.trimIn || 0, trimOut: clip.trimOut || 1 }; }, [clip.trimIn, clip.trimOut]);
  const handleRefs = useResize(clip.id, posRef, arRef, zoomRef, resizeRef, resizeEndRef);

  useEffect(() => {
    const v = vRef.current; if (!v || !clip.url) return;
    setErr(false); setPlaying(false);
    const onP = () => setPlaying(true);
    const onE = () => setErr(true);
    const onM = () => { if (v.videoWidth && v.videoHeight) arRef.current = v.videoWidth / v.videoHeight; if (v.duration && isFinite(v.duration)) setDuration(v.duration); };
    v.addEventListener("playing", onP); v.addEventListener("error", onE); v.addEventListener("loadedmetadata", onM);
    v.src = clip.url; v.load();
    const t = setTimeout(() => { v.play().then(() => setPlaying(true)).catch(() => { setTimeout(() => v.play().then(() => setPlaying(true)).catch(() => setErr(true)), 500); }); }, 100);
    return () => { clearTimeout(t); v.removeEventListener("playing", onP); v.removeEventListener("error", onE); v.removeEventListener("loadedmetadata", onM); };
  }, [clip.url]);

  useEffect(() => {
    const v = vRef.current; if (!v) return;
    const ck = () => { if (!v.duration || !isFinite(v.duration)) return; const { trimIn: ti, trimOut: to } = trimRef.current; if (v.currentTime >= to * v.duration || v.currentTime < ti * v.duration - 0.1) v.currentTime = ti * v.duration; };
    v.addEventListener("timeupdate", ck); return () => v.removeEventListener("timeupdate", ck);
  }, []);
  useEffect(() => { const v = vRef.current; if (v && v.duration && isFinite(v.duration)) { const tI = (clip.trimIn || 0) * v.duration; if (v.currentTime < tI) v.currentTime = tI; } }, [clip.trimIn]);
  useEffect(() => { if (vRef.current) vRef.current.muted = muted; }, [muted]);
  const handleTrim = useCallback((i, o) => { onTrim(clip.id, i, o); }, [clip.id, onTrim]);

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const onDown = e => { if (e.button !== 0 || e.target.closest("button") || e.target.closest("[data-resize]") || e.target.closest("[data-trim]")) return; e.preventDefault(); e.stopPropagation(); onPointerDown(clip.id, e); };
    el.addEventListener("pointerdown", onDown); return () => el.removeEventListener("pointerdown", onDown);
  }, [clip.id, onPointerDown]);

  const selB = selected ? `${T.clipShadow}, 0 0 0 2px ${T.selectBorder}` : `${T.clipShadow}, 0 0 0 1px ${T.border}`;

  return (
    <div ref={containerRef} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position: "absolute", left: clip.x, top: clip.y, width: clip.w, height: clip.h, zIndex: clip.z || 0, cursor: "grab", borderRadius: 6, overflow: "hidden", boxShadow: selB, background: T.clipBg, touchAction: "none" }}>
      <video ref={vRef} muted loop playsInline preload="auto" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
      {err && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.85)", color: "#e55", fontSize: 10, fontFamily: "monospace", padding: 12, textAlign: "center", zIndex: 2, pointerEvents: "none" }}>Cannot play<br />{clip.name}</div>}
      {!playing && !err && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.5)", zIndex: 2, pointerEvents: "none" }}><div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,.1)", borderTopColor: "rgba(255,255,255,.5)", borderRadius: "50%", animation: "vbs .7s linear infinite" }} /></div>}
      <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", opacity: hovered ? 1 : 0, transition: "opacity .15s", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ background: "linear-gradient(180deg,rgba(0,0,0,.55) 0%,transparent 100%)", padding: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,.5)", background: "rgba(0,0,0,.4)", padding: "1px 5px", borderRadius: 3, maxWidth: "72%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clip.name}</span>
            <button onClick={e => { e.stopPropagation(); onDelete(clip.id); }} style={{ pointerEvents: "all", background: T.delBg, border: "none", borderRadius: 3, color: "#fff", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ITrash /></button>
          </div>
        </div>
        <div style={{ background: "linear-gradient(0deg,rgba(0,0,0,.6) 0%,transparent 100%)", padding: "8px 5px 5px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={e => { e.stopPropagation(); setMuted(m => !m); }} style={{ pointerEvents: "all", background: "rgba(0,0,0,.35)", border: "none", borderRadius: 3, color: "#fff", width: 22, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><IVol on={!muted} /></button>
            <div style={{ flex: 1, pointerEvents: "all" }}><TrimTimeline vRef={vRef} trimIn={clip.trimIn || 0} trimOut={clip.trimOut || 1} onTrim={handleTrim} duration={duration} /></div>
          </div>
        </div>
      </div>
      <ResizeHandles handleRefs={handleRefs} />
    </div>
  );
}

/* ─── GuideLines + Marquee ─── */
function GuideLines({ guides }) {
  const T = useTheme();
  if (!guides.length) return null;
  return (
    <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "visible" }}>
      {guides.map((g, i) => g.type === "v"
        ? <line key={i} x1={g.pos} y1={g.min - 20} x2={g.pos} y2={g.max + 20} stroke={T.guide} strokeWidth={1} strokeDasharray="4 3" />
        : <line key={i} x1={g.min - 20} y1={g.pos} x2={g.max + 20} y2={g.pos} stroke={T.guide} strokeWidth={1} strokeDasharray="4 3" />
      )}
    </svg>
  );
}

function Marquee({ rect }) {
  const T = useTheme();
  if (!rect) return null;
  const x = Math.min(rect.x1, rect.x2), y = Math.min(rect.y1, rect.y2);
  const w = Math.abs(rect.x2 - rect.x1), h = Math.abs(rect.y2 - rect.y1);
  if (w < 2 && h < 2) return null;
  return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, border: `1px solid ${T.marquee}`, background: T.marqueeFill, borderRadius: 2, pointerEvents: "none", zIndex: 9998 }} />;
}

/* ─── App ─── */
function BoardApp({ user }) {
  const [mode, setMode] = useState("light");
  const T = themes[mode];
  const [boards, setBoards] = useState([]);
  const [bid, setBid] = useState(null);
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [menu, setMenu] = useState(false);
  const [renId, setRenId] = useState(null);
  const [renVal, setRenVal] = useState('');
  const [over, setOver] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [guides, setGuides] = useState([]);
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [marquee, setMarquee] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const spaceRef = useRef(false);
  const fileInputRef = useRef(null);
  const cvs = useRef(null);
  const nz = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const clipsRef = useRef([]);
  const selectedRef = useRef(new Set());
  const saveTimers = useRef({});

  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { clipsRef.current = clips; }, [clips]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const showToast = (msg, isErr = true) => { setToast({ msg, isErr }); setTimeout(() => setToast(null), 4000); };

  // load boards
  useEffect(() => {
    (async () => {
      try {
        let { data, error } = await supabase.from('boards').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        if (!data.length) {
          const { data: newB, error: e2 } = await supabase.from('boards').insert({ name: 'Board 1', user_id: user.id }).select();
          if (e2) throw e2;
          data = newB;
        }
        setBoards(data); setBid(data[0].id);
      } catch (e) { showToast('Failed to connect: ' + e.message); }
      setLoading(false);
    })();
  }, []);

  // load clips
  useEffect(() => {
    if (!bid) return;
    let dead = false;
    (async () => {
      try {
        const { data, error } = await supabase.from('clips').select('*').eq('board_id', bid).order('z', { ascending: true });
        if (error) throw error;
        if (dead) return;
        setClips(data.map(c => ({ ...c, url: getPublicUrl(c.storage_path) })));
        nz.current = data.reduce((m, c) => Math.max(m, c.z || 0), 0) + 1;
      } catch (e) { if (!dead) showToast('Failed to load clips: ' + e.message); }
    })();
    return () => { dead = true; };
  }, [bid]);

  // save pos debounced
  const savePos = useCallback((id, updates) => {
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      await supabase.from('clips').update(updates).eq('id', id);
    }, 400);
  }, []);

  // wheel zoom — deps include loading so it re-attaches after canvas appears
  useEffect(() => {
    const el = cvs.current;
    if (!el) return;
    const onW = e => {
      e.preventDefault();
      const d = -e.deltaY * 0.001;
      setZoom(z => {
        const n = Math.min(3, Math.max(0.1, z + d * z));
        const r = el.getBoundingClientRect();
        const cx = e.clientX - r.left, cy = e.clientY - r.top, s = n / z;
        setPan(p => ({ x: cx - s * (cx - p.x), y: cy - s * (cy - p.y) }));
        return n;
      });
    };
    el.addEventListener("wheel", onW, { passive: false });
    return () => el.removeEventListener("wheel", onW);
  }, [loading]);

  // canvas pointerdown: marquee select (left) or pan (middle)
  useEffect(() => {
    const el = cvs.current;
    if (!el) return;
    const onDown = e => {
      if (e.target !== el || e.button !== 0) return;
      e.preventDefault();
      if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.isContentEditable)) document.activeElement.blur();
      setCtxMenu(null);
      const startMx = e.clientX, startMy = e.clientY;
      const startPx = panRef.current.x, startPy = panRef.current.y;
      const isPan = spaceRef.current;
      let mode = null;
      const THRESHOLD = 4;
      if (!e.shiftKey && !isPan) setSelected(new Set());
      const onMv = ev => {
        ev.preventDefault();
        const dx = ev.clientX - startMx, dy = ev.clientY - startMy;
        if (!mode && Math.abs(dx) + Math.abs(dy) < THRESHOLD) return;
        if (!mode) mode = isPan ? "pan" : "marquee";
        if (mode === "pan") setPan({ x: startPx + dx, y: startPy + dy });
        else setMarquee({ x1: startMx, y1: startMy, x2: ev.clientX, y2: ev.clientY });
      };
      const onUp = ev => {
        if (mode === "marquee") {
          const rect = el.getBoundingClientRect(), z = zoomRef.current, p = panRef.current;
          const tc = (a, b) => ({ x: (a - rect.left - p.x) / z, y: (b - rect.top - p.y) / z });
          const c1 = tc(startMx, startMy), c2 = tc(ev.clientX, ev.clientY);
          const mx1 = Math.min(c1.x, c2.x), my1 = Math.min(c1.y, c2.y), mx2 = Math.max(c1.x, c2.x), my2 = Math.max(c1.y, c2.y);
          const hits = clipsRef.current.filter(c => c.x + c.w > mx1 && c.x < mx2 && c.y + c.h > my1 && c.y < my2);
          if (ev.shiftKey) setSelected(prev => { const n = new Set(prev); hits.forEach(h => n.add(h.id)); return n; });
          else setSelected(new Set(hits.map(h => h.id)));
          setMarquee(null);
        }
        window.removeEventListener("pointermove", onMv); window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMv); window.addEventListener("pointerup", onUp);
    };
    const onCtx = () => setMarquee(null);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("contextmenu", onCtx);
    return () => { el.removeEventListener("pointerdown", onDown); el.removeEventListener("contextmenu", onCtx); };
  }, [loading]);

  // global pan: middle-click or space+left anywhere
  useEffect(() => {
    const onDown = e => {
      const isMid = e.button === 1, isSpc = e.button === 0 && spaceRef.current;
      if (!isMid && !isSpc) return;
      e.preventDefault(); e.stopPropagation();
      const sx = e.clientX, sy = e.clientY, px = panRef.current.x, py = panRef.current.y;
      const onMv = ev => { ev.preventDefault(); setPan({ x: px + (ev.clientX - sx), y: py + (ev.clientY - sy) }); };
      const onUp = () => { window.removeEventListener("pointermove", onMv); window.removeEventListener("pointerup", onUp); };
      window.addEventListener("pointermove", onMv); window.addEventListener("pointerup", onUp);
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, []);

  // spacebar tracking
  useEffect(() => {
    const dn = e => { if (e.code === "Space" && e.target.tagName !== "INPUT" && !e.target.isContentEditable) { e.preventDefault(); spaceRef.current = true; setSpaceHeld(true); } };
    const up = e => { if (e.code === "Space") { spaceRef.current = false; setSpaceHeld(false); } };
    window.addEventListener("keydown", dn); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  // clip pointerdown: select + drag
  const onClipPointerDown = useCallback((id, e) => {
    const isShift = e.shiftKey;
    const wasSel = selectedRef.current.has(id);

    let newSel;
    if (isShift) {
      newSel = new Set(selectedRef.current);
      if (wasSel) newSel.delete(id); else newSel.add(id);
    } else if (wasSel && selectedRef.current.size > 1) {
      newSel = new Set(selectedRef.current);
    } else {
      newSel = new Set([id]);
    }
    setSelected(newSel);

    if (isShift && wasSel) return;

    const allSel = newSel;
    nz.current += allSel.size;

    const startMx = e.clientX, startMy = e.clientY;
    const startPositions = {};
    clipsRef.current.forEach(c => { if (allSel.has(c.id)) startPositions[c.id] = { x: c.x, y: c.y }; });

    const lead = clipsRef.current.find(c => c.id === id);
    if (!lead) return;
    const leadStartX = lead.x, leadStartY = lead.y;

    const onMv = ev => {
      ev.preventDefault();
      const z = zoomRef.current;
      const rawDx = (ev.clientX - startMx) / z;
      const rawDy = (ev.clientY - startMy) / z;
      const { x: snapX, y: snapY, guides: g } = calcSnap(allSel, leadStartX + rawDx, leadStartY + rawDy, lead.w, lead.h, clipsRef.current);
      const snapDx = snapX - leadStartX;
      const snapDy = snapY - leadStartY;
      setGuides(g);
      setClips(p => p.map(c => {
        if (!allSel.has(c.id)) return c;
        const sp = startPositions[c.id];
        return { ...c, x: sp.x + snapDx, y: sp.y + snapDy };
      }));
    };

    const onUp = () => {
      setGuides([]);
      // save final positions
      clipsRef.current.forEach(c => {
        if (allSel.has(c.id)) savePos(c.id, { x: c.x, y: c.y });
      });
      window.removeEventListener("pointermove", onMv);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMv);
    window.addEventListener("pointerup", onUp);
  }, [savePos]);

  const resizeClip = useCallback((id, nx, ny, rW, rH, corner) => {
    const cur = clipsRef.current, me = cur.find(c => c.id === id); if (!me) return;
    const aR = me.x + me.w, aB = me.y + me.h;
    const { w, h, guides: g } = calcResizeSnap(id, nx, ny, rW, rH, cur, corner);
    let fx, fy;
    if (corner === "br") { fx = me.x; fy = me.y; } else if (corner === "bl") { fx = aR - w; fy = me.y; }
    else if (corner === "tr") { fx = me.x; fy = aB - h; } else { fx = aR - w; fy = aB - h; }
    setClips(p => p.map(c => c.id === id ? { ...c, x: fx, y: fy, w, h } : c));
    setGuides(g);
    savePos(id, { x: fx, y: fy, w, h });
  }, [savePos]);
  const resizeEnd = useCallback(() => setGuides([]), []);
  const trimClip = useCallback((id, tI, tO) => { setClips(p => p.map(c => c.id === id ? { ...c, trimIn: tI, trimOut: tO } : c)); savePos(id, { trim_in: tI, trim_out: tO }); }, [savePos]);
  const updateText = useCallback((id, text) => { setClips(p => p.map(c => c.id === id ? { ...c, text } : c)); savePos(id, { text }); }, [savePos]);
  const updateStyle = useCallback((id, textStyle) => { setClips(p => p.map(c => c.id === id ? { ...c, textStyle } : c)); savePos(id, { text_style: textStyle }); }, [savePos]);
  const autoHeight = useCallback((id, h) => setClips(p => p.map(c => c.id === id ? { ...c, h } : c)), []);
  const deleteClip = useCallback(async (id) => {
    const clip = clipsRef.current.find(c => c.id === id);
    setClips(p => p.filter(c => c.id !== id));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    try { await supabase.from('clips').delete().eq('id', id); if (clip?.storage_path) await supabase.storage.from(BUCKET).remove([clip.storage_path]); } catch {}
  }, []);

  // keyboard
  useEffect(() => {
    const onKey = e => {
      if (e.target.tagName === "INPUT") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedRef.current.size > 0) {
        e.preventDefault();
        const toDelete = [...selectedRef.current];
        setClips(p => p.filter(c => !selectedRef.current.has(c.id)));
        setSelected(new Set());
        // delete from DB
        toDelete.forEach(async id => {
          const clip = clipsRef.current.find(c => c.id === id);
          try { await supabase.from('clips').delete().eq('id', id); if (clip?.storage_path) await supabase.storage.from(BUCKET).remove([clip.storage_path]); } catch {}
        });
      }
      if (e.key === "Escape") setSelected(new Set());
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        setClips(p => { setSelected(new Set(p.map(c => c.id))); return p; });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // upload
  const handleFiles = useCallback(async files => {
    if (!bid) return;
    const arr = Array.from(files);
    const media = arr.filter(f => f.type.startsWith("video/") || f.type.startsWith("image/"));
    if (!media.length) { showToast('No media files found', false); return; }
    setUploading(true);
    const rect = cvs.current.getBoundingClientRect();
    for (let i = 0; i < media.length; i++) {
      const file = media[i];
      const isImage = file.type.startsWith("image/");
      setUploadText(`Uploading ${i + 1}/${media.length}: ${file.name}`);
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${bid}/${crypto.randomUUID()}_${safeName}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const url = getPublicUrl(path);
        const cx = (rect.width / 2 - panRef.current.x) / zoomRef.current + (Math.random() - .5) * 300;
        const cy = (rect.height / 2 - panRef.current.y) / zoomRef.current + (Math.random() - .5) * 200;
        const z = nz.current++;
        let w = DEF_W, h = DEF_H;
        if (isImage) {
          const dims = await new Promise(res => { const img = new Image(); img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight }); img.onerror = () => res({ w: DEF_W, h: DEF_H }); img.src = url; });
          const scale = Math.min(DEF_W / dims.w, DEF_H / dims.h, 1);
          w = Math.max(MIN_W, dims.w * scale); h = Math.max(MIN_H, dims.h * scale);
        }
        const clipType = isImage ? "image" : "video";
        const { data, error: dbErr } = await supabase.from('clips').insert({ board_id: bid, name: file.name, storage_path: path, x: cx - w / 2, y: cy - h / 2, w, h, z, type: clipType }).select();
        if (dbErr) throw dbErr;
        if (data?.length) setClips(p => [...p, { ...data[0], url }]);
      } catch (e) { showToast(`Upload failed: ${file.name} — ${e.message}`); }
    }
    setUploading(false); setUploadText('');
  }, [bid]);

  // board ops
  const newBoard = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('boards').insert({ name: `Board ${boards.length + 1}`, user_id: user.id }).select();
      if (error) throw error;
      if (data?.length) { setBoards(p => [...p, data[0]]); setBid(data[0].id); }
    } catch { showToast('Create board failed'); }
    setMenu(false);
  }, [boards]);

  const delBoard = useCallback(async id => {
    if (boards.length <= 1) return;
    try {
      const { data: cd } = await supabase.from('clips').select('storage_path').eq('board_id', id);
      if (cd?.length) await supabase.storage.from(BUCKET).remove(cd.map(c => c.storage_path));
      await supabase.from('boards').delete().eq('id', id);
    } catch { showToast('Delete board failed'); }
    const nb = boards.filter(b => b.id !== id);
    setBoards(nb); if (bid === id) setBid(nb[0]?.id);
  }, [boards, bid]);

  const renBoard = useCallback(async () => {
    if (renId && renVal.trim()) {
      try { await supabase.from('boards').update({ name: renVal.trim() }).eq('id', renId); setBoards(p => p.map(b => b.id === renId ? { ...b, name: renVal.trim() } : b)); } catch {}
    }
    setRenId(null);
  }, [renId, renVal]);

  const addTextAt = useCallback((cx, cy) => {
    if (cx === undefined) { const rect = cvs.current.getBoundingClientRect(); cx = (rect.width / 2 - panRef.current.x) / zoomRef.current; cy = (rect.height / 2 - panRef.current.y) / zoomRef.current; }
    setClips(p => [...p, { id: uid(), type: "text", text: "Title", textStyle: "title", x: cx - 150, y: cy - 35, w: 300, h: 70, z: nz.current++ }]);
  }, []);
  const addNoteAt = useCallback((cx, cy) => {
    if (cx === undefined) { const rect = cvs.current.getBoundingClientRect(); cx = (rect.width / 2 - panRef.current.x) / zoomRef.current; cy = (rect.height / 2 - panRef.current.y) / zoomRef.current; }
    setClips(p => [...p, { id: uid(), type: "note", text: "Type a note...", x: cx - 100, y: cy - 60, w: 200, h: 120, z: nz.current++ }]);
  }, []);
  const addText = useCallback(() => addTextAt(), [addTextAt]);
  const addNote = useCallback(() => addNoteAt(), [addNoteAt]);
  const handleContextMenu = useCallback(e => {
    e.preventDefault();
    const rect = cvs.current.getBoundingClientRect();
    const z = zoomRef.current, p = panRef.current;
    setCtxMenu({ screenX: e.clientX, screenY: e.clientY, canvasX: (e.clientX - rect.left - p.x) / z, canvasY: (e.clientY - rect.top - p.y) / z });
  }, []);

  const zIn = () => setZoom(z => Math.min(3, z * 1.25));
  const zOut = () => setZoom(z => Math.max(.1, z / 1.25));
  const fit = () => { setPan({ x: 0, y: 0 }); setZoom(1); };
  // ab and btnS defined below with theme

  if (loading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#101012", color: "#444", fontFamily: "monospace", fontSize: 13 }}>Connecting to database...</div>;


  const ab = boards.find(b => b.id === bid);
  const btnS = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, color: T.textMuted, padding: "5px 11px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "'DM Sans',system-ui,sans-serif" };

  return (
    <ThemeCtx.Provider value={T}>
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden", background: T.bg, fontFamily: "'DM Sans',system-ui,sans-serif", position: "relative", userSelect: "none", transition: "background .3s" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;900&display=swap" rel="stylesheet"/>
      <style>{`@keyframes vbs{to{transform:rotate(360deg)}}`}</style>

      {toast && <div style={{ position: "absolute", top: 54, left: "50%", transform: "translateX(-50%)", zIndex: 3000, background: toast.isErr ? "rgba(220,50,50,.9)" : "rgba(50,180,80,.85)", color: "#fff", padding: "7px 16px", borderRadius: 7, fontSize: 11.5, fontFamily: "monospace", maxWidth: 450, textAlign: "center", boxShadow: "0 6px 24px rgba(0,0,0,.35)" }}>{toast.msg}</div>}
      {uploading && <div style={{ position: "absolute", top: 54, left: "50%", transform: "translateX(-50%)", zIndex: 3000, background: T.surfaceSolid, border: `1px solid ${T.border}`, color: T.textMuted, padding: "7px 18px", borderRadius: 7, fontSize: 11.5, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 6px 24px rgba(0,0,0,.12)" }}>
        <div style={{ width: 12, height: 12, border: "2px solid rgba(0,0,0,.1)", borderTopColor: T.accent, borderRadius: "50%", animation: "vbs .7s linear infinite" }}/> {uploadText}
      </div>}

      {/* floating board name - top left */}
      <div style={{ position: "absolute", top: 12, left: 14, zIndex: 1000, pointerEvents: "all", display: "flex", alignItems: "baseline", gap: 10 }}>
        <div style={{ position: "relative" }}>
          {editingName && renId === bid ? (
            <input autoFocus value={renVal} onChange={e => setRenVal(e.target.value)}
              onBlur={() => { renBoard(); setEditingName(false); }}
              onKeyDown={e => { if (e.key === "Enter") { renBoard(); setEditingName(false); } if (e.key === "Escape") { setRenId(null); setEditingName(false); } }}
              style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 6, color: T.inputText, fontSize: 20, fontWeight: 400, fontFamily: "'DM Sans',system-ui,sans-serif", padding: "4px 10px", outline: "none", width: 260, letterSpacing: "-0.02em" }}/>
          ) : (
            <span onClick={() => setMenu(v => !v)} onDoubleClick={e => { e.stopPropagation(); setRenId(bid); setRenVal(ab?.name || ''); setEditingName(true); }}
              style={{ color: T.text, fontSize: 20, fontWeight: 400, fontFamily: "'DM Sans',system-ui,sans-serif", cursor: "pointer", letterSpacing: "-0.02em", opacity: 0.7 }} title="Click for boards · Double-click to rename">
              {ab?.name || "..."} <span style={{ fontSize: 12, opacity: 0.4 }}>▾</span>
            </span>
          )}
          {menu && <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, minWidth: 210, background: T.surfaceSolid, border: `1px solid ${T.border}`, borderRadius: 9, padding: 3, boxShadow: "0 10px 36px rgba(0,0,0,.15)", zIndex: 2000 }}>
            {boards.map(b => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 9px", borderRadius: 5, cursor: "pointer", background: b.id === bid ? T.accentBg : "transparent" }}
                onClick={() => { setBid(b.id); setMenu(false); }}>
                <span style={{ fontSize: 12.5, color: T.text, fontFamily: "'DM Sans',system-ui,sans-serif" }}>{b.name}</span>
                {boards.length > 1 && <button onClick={e => { e.stopPropagation(); delBoard(b.id); }} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", padding: "0 2px", fontSize: 11 }}>✕</button>}
              </div>
            ))}
            <div onClick={newBoard} style={{ padding: "5px 9px", borderRadius: 5, cursor: "pointer", fontSize: 12, color: T.accentText, display: "flex", alignItems: "center", gap: 4, marginTop: 2, borderTop: `1px solid ${T.border}` }}>
              <IPlus/> New board
            </div>
          </div>}
        </div>
        <span style={{ color: T.textDim, fontSize: 10.5, fontFamily: "'DM Sans',system-ui,sans-serif" }}>
          {clips.length} item{clips.length !== 1 ? "s" : ""}{selected.size > 0 && ` · ${selected.size} selected`}
        </span>
      </div>

      {/* floating buttons - top right */}
      <div style={{ position: "absolute", top: 12, right: 14, zIndex: 1000, display: "flex", alignItems: "center", gap: 5, pointerEvents: "all" }}>
        <button onClick={addNote} style={btnS}><INote /> Note</button>
        <button onClick={addText} style={btnS}><IText /> Title</button>
        <label style={{ ...btnS, cursor: "pointer" }}>
          <IPlus /> Media
          <input type="file" multiple accept="video/*,image/*" style={{ display: "none" }} onChange={e => { if (e.target.files.length) handleFiles(e.target.files); e.target.value = ""; }} />
        </label>
      </div>

      {/* zoom + theme */}
      <div style={{ position: "absolute", bottom: 12, left: 12, zIndex: 1000, display: "flex", gap: 1, background: T.toolBg, border: `1px solid ${T.toolBorder}`, borderRadius: 7, padding: 2, alignItems: "center" }}>
        {[{ i: <IZOut/>, a: zOut }, { i: <span style={{ fontSize: 10.5, fontFamily: "monospace", color: T.textMuted, minWidth: 38, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>, a: fit }, { i: <IZIn/>, a: zIn }].map((b, i) => (
          <button key={i} onClick={b.a} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", padding: "4px 5px", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>{b.i}</button>
        ))}
        <div style={{ width: 1, height: 16, background: T.border, margin: "0 2px" }} />
        <button onClick={() => setMode(m => m === "dark" ? "light" : "dark")} title={mode === "dark" ? "Light mode" : "Dark mode"}
          style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", padding: "4px 5px", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {mode === "dark" ? <ISun /> : <IMoon />}
        </button>
        <div style={{ width: 1, height: 16, background: T.border, margin: "0 2px" }} />
        <button onClick={() => supabase.auth.signOut()} title="Sign out"
          style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", padding: "4px 5px", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontFamily: "'DM Sans',system-ui,sans-serif" }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M6 8h8"/></svg>
        </button>
      </div>

      {/* canvas */}
      <div ref={cvs} onDrop={e => { e.preventDefault(); setOver(false); handleFiles(e.dataTransfer.files); }} onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onContextMenu={handleContextMenu} onClick={() => setCtxMenu(null)}
        style={{ position: "absolute", inset: 0, overflow: "hidden", touchAction: "none", cursor: spaceHeld ? "grab" : "default" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `radial-gradient(circle,${T.dot} 1px,transparent 1px)`, backgroundSize: `${40 * zoom}px ${40 * zoom}px`, backgroundPosition: `${pan.x % (40 * zoom)}px ${pan.y % (40 * zoom)}px` }}/>
        {over && <div style={{ position: "absolute", inset: 0, zIndex: 999, background: T.dropBg, border: `2px dashed ${T.dropBorder}`, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ background: T.surfaceSolid, borderRadius: 10, padding: "14px 24px", color: T.accentText, fontSize: 14, fontWeight: 500 }}>Drop files here</div>
        </div>}
        <Marquee rect={marquee}/>
        <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
          {clips.map(c => {
            if (c.type === "note") return <NoteBlock key={c.id} clip={c} zoom={zoom} selected={selected.has(c.id)} onPointerDown={onClipPointerDown} onResize={resizeClip} onResizeEnd={resizeEnd} onDelete={deleteClip} onUpdateText={updateText} />;
            if (c.type === "text") return <TextBlock key={c.id} clip={c} zoom={zoom} selected={selected.has(c.id)} onPointerDown={onClipPointerDown} onResize={resizeClip} onResizeEnd={resizeEnd} onDelete={deleteClip} onUpdateText={updateText} onUpdateStyle={updateStyle} onAutoHeight={autoHeight} />;
            if (c.type === "image") return <ImageClip key={c.id} clip={c} zoom={zoom} selected={selected.has(c.id)} onPointerDown={onClipPointerDown} onResize={resizeClip} onResizeEnd={resizeEnd} onDelete={deleteClip} />;
            return <VideoClip key={c.id} clip={c} zoom={zoom} selected={selected.has(c.id)} onPointerDown={onClipPointerDown} onResize={resizeClip} onResizeEnd={resizeEnd} onDelete={deleteClip} onTrim={trimClip} />;
          })}
          <GuideLines guides={guides}/>
        </div>
        {clips.length === 0 && !over && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: T.textMuted, fontSize: 13, fontWeight: 500, marginBottom: 5 }}>Drop media or add elements</div>
            <div style={{ color: T.textDim, fontSize: 11, fontFamily: "'DM Sans',system-ui,sans-serif" }}>right-click to add · space+drag to pan</div>
          </div>
        </div>}

        {/* right-click context menu */}
        {ctxMenu && <div style={{ position: "fixed", left: ctxMenu.screenX, top: ctxMenu.screenY, zIndex: 2000, background: T.surfaceSolid, border: `1px solid ${T.border}`, borderRadius: 8, padding: 4, boxShadow: "0 8px 30px rgba(0,0,0,.15)", minWidth: 150 }}>
          {[
            { label: "Title", icon: <IText />, action: () => { addTextAt(ctxMenu.canvasX, ctxMenu.canvasY); setCtxMenu(null); } },
            { label: "Note", icon: <INote />, action: () => { addNoteAt(ctxMenu.canvasX, ctxMenu.canvasY); setCtxMenu(null); } },
            { label: "Media...", icon: <IPlus />, action: () => { setCtxMenu(null); if (fileInputRef.current) fileInputRef.current.click(); } },
          ].map((item, i) => (
            <button key={i} onClick={item.action}
              onMouseEnter={e => { e.currentTarget.style.background = T.accentBg; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 12px", border: "none", background: "transparent", color: T.text, fontSize: 13, fontFamily: "'DM Sans',system-ui,sans-serif", cursor: "pointer", borderRadius: 5, textAlign: "left" }}>
              <span style={{ color: T.textMuted, display: "flex" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>}
        <input ref={fileInputRef} type="file" multiple accept="video/*,image/*" style={{ display: "none" }} onChange={e => { if (e.target.files.length) handleFiles(e.target.files); e.target.value = ""; }} />
      </div>

      {menu && <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={() => setMenu(false)}/>}
    </div>
    </ThemeCtx.Provider>
  );
}

/* ─── Auth Gate ─── */
function AuthGate() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); setInfo("");
    if (!email || !password) { setError("Please fill in all fields"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Check your email for a confirmation link");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) { setError(e.message); }
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#eeecea", fontFamily: "'DM Sans',system-ui,sans-serif" }}>
        <div style={{ color: "rgba(0,0,0,.3)", fontSize: 13 }}>Loading...</div>
      </div>
    );
  }

  if (user) return <BoardApp user={user} />;

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#eeecea", fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: 340, padding: "40px 32px", background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 8px 40px rgba(0,0,0,.06)" }}>
        <div style={{ fontSize: 24, fontWeight: 400, color: "rgba(0,0,0,.8)", marginBottom: 4, letterSpacing: "-0.02em" }}>
          {authMode === "login" ? "Sign in" : "Create account"}
        </div>
        <div style={{ fontSize: 13, color: "rgba(0,0,0,.35)", marginBottom: 28 }}>
          {authMode === "login" ? "Enter your credentials to continue" : "Set up your account"}
        </div>

        {error && <div style={{ background: "rgba(220,50,50,.08)", border: "1px solid rgba(220,50,50,.15)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "rgba(180,40,40,.8)", marginBottom: 16 }}>{error}</div>}
        {info && <div style={{ background: "rgba(50,150,80,.08)", border: "1px solid rgba(50,150,80,.15)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "rgba(30,120,60,.8)", marginBottom: 16 }}>{info}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,.1)", fontSize: 14, fontFamily: "'DM Sans',system-ui,sans-serif", outline: "none", background: "rgba(0,0,0,.02)", color: "rgba(0,0,0,.8)" }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSubmit(e); }}
            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,.1)", fontSize: 14, fontFamily: "'DM Sans',system-ui,sans-serif", outline: "none", background: "rgba(0,0,0,.02)", color: "rgba(0,0,0,.8)" }} />
          <button onClick={handleSubmit}
            style={{ padding: "10px 14px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans',system-ui,sans-serif", cursor: "pointer", background: "rgba(0,0,0,.8)", color: "#fff", marginTop: 4 }}>
            {authMode === "login" ? "Sign in" : "Create account"}
          </button>
        </div>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 12.5, color: "rgba(0,0,0,.35)" }}>
          {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => { setAuthMode(m => m === "login" ? "signup" : "login"); setError(""); setInfo(""); }}
            style={{ color: "rgba(0,0,0,.6)", cursor: "pointer", textDecoration: "underline" }}>
            {authMode === "login" ? "Sign up" : "Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AuthGate;
