import { useCallback } from "react";
import { getBezierPath } from "@xyflow/react";
import type { EsportType } from "../types";

interface CustomConnectionLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  esport: EsportType;
  isDefault?: boolean;
}

export default function CustomConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  esport,
  isDefault = false,
}: CustomConnectionLineProps) {
  const [edgePath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: undefined,
    targetX: toX,
    targetY: toY,
    targetPosition: undefined,
  });

  // Determinar el estilo y color según el esport y si es default
  const getConnectionStyle = useCallback(() => {
    if (isDefault) {
      return {
        stroke: "#ef4444", // Rojo para edges default (derrota)
        strokeWidth: 3,
        strokeDasharray: "5,5", // Línea punteada para default
      };
    }

    // Para esports competitivos, usar colores específicos
    if (esport !== "fortnite") {
      return {
        stroke: "#10b981", // Verde para edges de victoria
        strokeWidth: 3,
        strokeDasharray: "none", // Línea sólida para victoria
      };
    }

    // Para Fortnite, usar azul para edges configurables
    return {
      stroke: "#3b82f6", // Azul para Fortnite
      strokeWidth: 3,
      strokeDasharray: "none",
    };
  }, [esport, isDefault]);

  // Determinar el label que se mostrará
  const getConnectionLabel = useCallback(() => {
    if (isDefault) {
      return "Derrota";
    }

    if (esport !== "fortnite") {
      return "Ganador";
    }

    return "Victoria";
  }, [esport, isDefault]);

  const style = getConnectionStyle();
  const label = getConnectionLabel();

  return (
    <g>
      {/* Línea de conexión principal */}
      <path
        d={edgePath}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        className="react-flow__connection-line"
      />
      
      {/* Label flotante en el centro de la conexión */}
      <text
        x={(fromX + toX) / 2}
        y={(fromY + toY) / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-medium pointer-events-none select-none"
        fill={style.stroke}
        style={{
          filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8))",
        }}
      >
        {label}
      </text>
      
      {/* Indicador visual adicional */}
      <circle
        cx={(fromX + toX) / 2}
        cy={(fromY + toY) / 2}
        r={3}
        fill={style.stroke}
        className="pointer-events-none"
      />
    </g>
  );
}
