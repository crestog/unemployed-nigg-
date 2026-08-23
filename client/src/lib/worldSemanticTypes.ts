export type SemanticBoundary = {
  id: string;
  name: string;
  d: string;
  geometry?: GeoJSON.Geometry;
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
