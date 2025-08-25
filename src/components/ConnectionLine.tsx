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
  
  // Calcular posición del label
  const labelX = (fromX + toX) / 2;
  const labelY = (fromY + toY) / 2;
  
  // ID único para la máscara (evita conflictos si hay múltiples conexiones)
  const maskId = `connectionMask-${fromX}-${fromY}-${toX}-${toY}`;

  return (
    <g>
      {/* Definición de la máscara SVG */}
      <defs>
        <mask id={maskId}>
          {/* Todo visible por defecto */}
          <rect x="-10000" y="-10000" width="20000" height="20000" fill="white" />
          {/* Hacemos el "agujero" donde va el label - rectángulo del tamaño del texto */}
          <rect 
            x={labelX - 25} 
            y={labelY - 10} 
            width={50} 
            height={20} 
            fill="black" 
            rx={3}
          />
        </mask>
      </defs>

      {/* Línea de conexión principal con máscara aplicada */}
      <path
        d={edgePath}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        className="react-flow__connection-line"
        mask={`url(#${maskId})`}
      />
      
      {/* Label flotante en el centro de la conexión */}
      <text
        x={labelX}
        y={labelY}
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
    </g>
  );
}
