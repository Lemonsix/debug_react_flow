import { BaseEdge } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";

export default function CurvedLabelEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  // Crear el path de la curva usando una curva de Bézier
  const edgePath = `M${sourceX},${sourceY} C ${
    (sourceX + targetX) / 2
  },${sourceY} ${(sourceX + targetX) / 2},${targetY} ${targetX},${targetY}`;

  const outcome = (data as { outcome?: string })?.outcome || "derrota";

  return (
    <>
      {/* Edge base invisible para mantener la funcionalidad */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: "transparent",
          strokeWidth: 0,
        }}
      />

      {/* Path invisible para el textPath */}
      <path id={`${id}-path`} d={edgePath} fill="none" stroke="none" />

      {/* Múltiples instancias de texto a lo largo de la curva */}
      {[0.1, 0.3, 0.5, 0.7, 0.9].map((offset, index) => (
        <text
          key={index}
          dy={-5}
          style={{
            fontSize: 11,
            fill: "#666",
            fontWeight: "bold",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <textPath
            href={`#${id}-path`}
            startOffset={`${offset * 100}%`}
            textAnchor="middle"
          >
            {outcome}
          </textPath>
        </text>
      ))}

      {/* Texto adicional con guiones para mayor densidad */}
      {[0.2, 0.4, 0.6, 0.8].map((offset, index) => (
        <text
          key={`dash-${index}`}
          dy={-5}
          style={{
            fontSize: 9,
            fill: "#999",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <textPath
            href={`#${id}-path`}
            startOffset={`${offset * 100}%`}
            textAnchor="middle"
          >
            -
          </textPath>
        </text>
      ))}
    </>
  );
}
