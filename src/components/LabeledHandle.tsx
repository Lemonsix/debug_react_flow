import { Handle, Position, type HandleProps } from "@xyflow/react";

interface LabeledHandleProps extends Omit<HandleProps, 'position'> {
  id: string;
  title: string;
  type: "source" | "target";
  position: Position;
  className?: string;
  style?: React.CSSProperties;
}

export function LabeledHandle({ 
  id, 
  title, 
  type, 
  position, 
  className = "",
  style,
  ...handleProps 
}: LabeledHandleProps) {
  const isLeft = position === Position.Left;
  const isRight = position === Position.Right;
  const isTop = position === Position.Top;
  const isBottom = position === Position.Bottom;

  const getLabelStyle = () => {
    if (isLeft) {
      return {
        left: "100%", // Cambiar de right a left para que aparezca del lado derecho
        top: "50%",
        transform: "translateY(-50%)",
        textAlign: "left" as const,
      };
    }
    if (isRight) {
      return {
        right: "100%",
        top: "50%",
        transform: "translateY(-50%)",
        textAlign: "right" as const,
      };
    }
    if (isTop) {
      return {
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginBottom: "8px",
        textAlign: "center" as const,
      };
    }
    if (isBottom) {
      return {
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginTop: "8px",
        textAlign: "center" as const,
      };
    }
    return {};
  };

  return (
    <div className={`relative ${className}`} style={style}>
      <Handle
        id={id}
        type={type}
        position={position}
        style={{
          width: (style as any)?.width || 15,
          height: (style as any)?.height || 15,
        }}
        {...handleProps}
      />
      <div
        className="absolute text-xs font-medium text-gray-600 whitespace-nowrap z-10"
        style={getLabelStyle()}
      >
        {title}
      </div>
    </div>
  );
}
