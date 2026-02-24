import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

const CELL_SIZE = 26;
const GAP = 0.1;
const STEP = CELL_SIZE + GAP;
const MOUSE_RADIUS = 140;
const MOUSE_BOOST = 0.85;

type Cell = {
  value: string;
  phase: number;
  period: number;
  baseOpacity: number;
  peakOpacity: number;
};

function generateCells(cols: number, rows: number): Cell[] {
  return Array.from({ length: rows * cols }, () => ({
    value: Math.random() > 0.5 ? "1" : "0",
    phase: Math.random() * Math.PI * 2,
    period: 4000 + Math.random() * 10000,
    baseOpacity: 0.06 + Math.random() * 0.1,
    peakOpacity: 0.28 + Math.random() * 0.5,
  }));
}

function lerpColor(opacity: number) {
  const r = Math.round(10 + opacity * 50);
  const g = Math.round(18 + opacity * 25);
  const b = Math.round(80 + opacity * 80);
  return `rgb(${r},${g},${b})`;
}

export default function BinaryBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const smoothMouseRef = useRef({ x: -9999, y: -9999, boost: 0 });
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(performance.now());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellsRef = useRef<Cell[]>([]);
  const dimsRef = useRef({ cols: 0, rows: 0, width: 0, height: 0 });

  // buildGrid accepts explicit dimensions so ResizeObserver can pass the
  // freshly-measured values directly, bypassing the stale scrollHeight problem.
  const buildGrid = useCallback((forceWidth?: number, forceHeight?: number) => {
    const el = containerRef.current;
    if (!el) return;

    const width = forceWidth ?? (document.documentElement.clientWidth || window.innerWidth);
    const height = Math.max(
      forceHeight ?? document.body.scrollHeight,
      window.innerHeight
    );
    const cols = Math.ceil(width / STEP) + 1;
    const rows = Math.ceil(height / STEP) + 1;

    // Skip if the grid cell count hasn't changed — avoids resetting animation
    // phases on every scroll event while still catching real size changes.
    if (dimsRef.current.cols === cols && dimsRef.current.rows === rows) {
      return;
    }

    dimsRef.current = { cols, rows, width, height };
    cellsRef.current = generateCells(cols, rows);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      el.style.width = "100%";
      el.style.height = `${height}px`;
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = (e.clientX || 0) + (window.scrollX || window.pageXOffset || 0);
    const y = (e.clientY || 0) + (window.scrollY || window.pageYOffset || 0);
    if (mouseRef.current.x < 0) {
      smoothMouseRef.current.x = x;
      smoothMouseRef.current.y = y;
    }
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -9999, y: -9999 };
  }, []);

  useEffect(() => {
    buildGrid();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        buildGrid(
          Math.round(width || document.documentElement.clientWidth),
          Math.round(height)
        );
      }
    });
    ro.observe(document.body);

    // Also handle viewport resize (window width changes etc.)
    const onResize = () => buildGrid();
    window.addEventListener("resize", onResize);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    const draw = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { rafRef.current = requestAnimationFrame(draw); return; }
      const { cols, rows, width, height } = dimsRef.current;
      const cells = cellsRef.current;
      const elapsed = now - startRef.current;
      const target = mouseRef.current;
      const smooth = smoothMouseRef.current;

      const posLerp = 0.08;
      const boostLerp = 0.045;

      const isOffscreen = target.x < 0;
      if (isOffscreen) {
        smooth.boost += (0 - smooth.boost) * 0.012;
      } else {
        smooth.x += (target.x - smooth.x) * posLerp;
        smooth.y += (target.y - smooth.y) * posLerp;
        smooth.boost += (1 - smooth.boost) * boostLerp;
      }

      const mx = smooth.x;
      const my = smooth.y;
      const boostStrength = smooth.boost;

      ctx.clearRect(0, 0, width, height);
      ctx.font = `700 ${CELL_SIZE - 8}px "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          const cell = cells[idx];
          if (!cell) continue;

          const cx = col * STEP + CELL_SIZE / 2;
          const cy = row * STEP + CELL_SIZE / 2;

          const t = (elapsed % cell.period) / cell.period;
          const sine = (Math.sin(t * Math.PI * 2 + cell.phase) + 1) / 2;
          let opacity = cell.baseOpacity + sine * (cell.peakOpacity - cell.baseOpacity);

          const dx = cx - mx;
          const dy = cy - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS && boostStrength > 0.01) {
            const falloff = (Math.cos((dist / MOUSE_RADIUS) * Math.PI) + 1) / 2;
            opacity = Math.min(1, opacity + falloff * MOUSE_BOOST * boostStrength);
          }

          ctx.globalAlpha = opacity;
          ctx.fillStyle = lerpColor(opacity);
          ctx.fillText(cell.value, cx, cy);
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [buildGrid, handleMouseMove, handleMouseLeave]);

  const bg = (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }} />

      {/* Radial vignette */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at center, transparent 20%, rgba(13,10,18,0.65) 65%, rgba(13,10,18,0.95) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );

  if (typeof document !== "undefined" && document.body) {
    return createPortal(bg, document.body);
  }

  return bg;
}