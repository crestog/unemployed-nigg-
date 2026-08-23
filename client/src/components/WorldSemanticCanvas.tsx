import { useEffect, useRef } from "react";

export type SemanticBoundary = {
  id: string;
  name: string;
  d: string;
  x: number;
  y: number;
  kind: "adm1" | "adm2";
  opacity: number;
  selected: boolean;
  label: boolean;
};

export type SemanticLocality = {
  id: string;
  name: string;
  x: number;
  y: number;
  population: number;
  selected: boolean;
  label: boolean;
};

type WorldSemanticCanvasProps = {
  width: number;
  height: number;
  dpr: number;
  cameraK: number;
  adm1: SemanticBoundary[];
  adm2: SemanticBoundary[];
  localities: SemanticLocality[];
};

const drawBoundary = (
  context: CanvasRenderingContext2D,
  boundary: SemanticBoundary,
  path: Path2D,
  cameraK: number
) => {
  const baseColor = boundary.kind === "adm1" ? "#ba7a48" : "#d4ae54";
  context.save();
  context.globalAlpha = boundary.opacity;
  context.lineWidth =
    (boundary.selected
      ? boundary.kind === "adm1"
        ? 1.8
        : 1.6
      : boundary.kind === "adm1"
        ? 0.9
        : 0.55) / cameraK;
  context.strokeStyle = boundary.selected ? "#fff1c7" : baseColor;
  context.fillStyle = boundary.selected ? "#ffbf69" : baseColor;
  context.globalAlpha = boundary.selected
    ? 0.2
    : boundary.kind === "adm1"
      ? 0.035
      : 0.018;
  context.fill(path);
  context.globalAlpha = boundary.opacity;
  context.stroke(path);
  context.restore();
};

export default function WorldSemanticCanvas({
  width,
  height,
  dpr,
  cameraK,
  adm1,
  adm2,
  localities,
}: WorldSemanticCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathCacheRef = useRef(new Map<string, { d: string; path: Path2D }>());
  const safeCameraK = Number.isFinite(cameraK) && cameraK > 0 ? cameraK : 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pixelRatio = Math.min(1.5, Math.max(1, dpr));
    canvas.width = Math.max(1, Math.round(width * pixelRatio));
    canvas.height = Math.max(1, Math.round(height * pixelRatio));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    const getPath = (boundary: SemanticBoundary) => {
      const cached = pathCacheRef.current.get(boundary.id);
      if (cached?.d === boundary.d) return cached.path;
      const path = new Path2D(boundary.d);
      pathCacheRef.current.set(boundary.id, { d: boundary.d, path });
      return path;
    };
    const activeIds = new Set([...adm1, ...adm2].map(boundary => boundary.id));
    Array.from(pathCacheRef.current.keys()).forEach(id => {
      if (!activeIds.has(id)) pathCacheRef.current.delete(id);
    });

    adm1.forEach(boundary =>
      drawBoundary(context, boundary, getPath(boundary), safeCameraK)
    );
    adm2.forEach(boundary =>
      drawBoundary(context, boundary, getPath(boundary), safeCameraK)
    );

    context.textAlign = "center";
    context.textBaseline = "middle";
    adm1.forEach(boundary => {
      if (!boundary.label) return;
      context.save();
      context.font = `700 ${13 / safeCameraK}px system-ui, sans-serif`;
      context.fillStyle = "#f2c18a";
      context.shadowColor = "#08111d";
      context.shadowBlur = 3 / safeCameraK;
      context.fillText(
        boundary.name.length > 22
          ? `${boundary.name.slice(0, 21)}…`
          : boundary.name,
        boundary.x,
        boundary.y
      );
      context.restore();
    });
    adm2.forEach(boundary => {
      if (!boundary.label) return;
      context.save();
      context.font = `650 ${12 / safeCameraK}px system-ui, sans-serif`;
      context.fillStyle = "#f2d88e";
      context.shadowColor = "#08111d";
      context.shadowBlur = 3 / safeCameraK;
      context.fillText(
        boundary.name.length > 18
          ? `${boundary.name.slice(0, 17)}…`
          : boundary.name,
        boundary.x,
        boundary.y
      );
      context.restore();
    });
    localities.forEach(locality => {
      const screenRadius = Math.max(
        2.2,
        Math.min(6.2, 2 + Math.log10(locality.population + 1) * 0.42)
      );
      const radius = screenRadius / safeCameraK;
      context.save();
      context.beginPath();
      context.arc(
        locality.x,
        locality.y,
        locality.selected ? radius + 2 / safeCameraK : radius,
        0,
        Math.PI * 2
      );
      context.fillStyle = locality.selected ? "#ffbf69" : "#45d7c0";
      context.globalAlpha = locality.selected ? 0.95 : 0.82;
      context.fill();
      context.lineWidth = 0.7 / safeCameraK;
      context.strokeStyle = locality.selected ? "#fff1c7" : "#092033";
      context.stroke();
      if (locality.label) {
        context.globalAlpha = 1;
        context.font = `650 ${12 / safeCameraK}px system-ui, sans-serif`;
        context.textAlign = "left";
        context.fillStyle = "#b8eee6";
        context.shadowColor = "#08111d";
        context.shadowBlur = 3 / safeCameraK;
        context.fillText(
          locality.name.length > 20
            ? `${locality.name.slice(0, 19)}…`
            : locality.name,
          locality.x + 6 / safeCameraK,
          locality.y + 3 / safeCameraK
        );
      }
      context.restore();
    });
  }, [adm1, adm2, dpr, height, safeCameraK, width, localities]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
