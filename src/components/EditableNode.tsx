import { Handle, Position } from "@xyflow/react";
import { PencilIcon, SaveIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useState, useMemo } from "react";
import type { GraphNode, MatchConfiguration, EsportType, SinkConfiguration } from "../types";
import {
  validateNodeForm,
  validateTournamentStructure,
} from "../utils/validation";
import { MatchConfigEditor, PodiumConfigEditor } from "./FormComponents";
import { validateMatchForEsport } from "../config/esports";
import { LabeledHandle } from "./LabeledHandle";

interface EditableNodeProps {
  data: GraphNode;
  onChange?: (updates: Partial<GraphNode>) => void;
  isConnectable?: boolean;
  isEditing?: boolean;
  onStartEditing?: () => void;
  onStopEditing?: () => void;
  allNodes?: GraphNode[];
  esport: EsportType; // Prop para validación del esport
}

export default function EditableNode({
  data,
  onChange,
  isConnectable = true,
  isEditing: globalIsEditing = false,
  onStartEditing,
  onStopEditing,
  allNodes = [],
  esport,
}: EditableNodeProps) {
  // Usar el estado global de edición en lugar del local
  // Los nodos sink pueden ser editados si son podios
  const isEditing =
    data.type === "sink" && data.sinkConfig?.sinkType === "podium" 
      ? globalIsEditing || data.editable
      : data.type === "sink" 
        ? false 
        : globalIsEditing || data.editable;

  const [formData, setFormData] = useState({
    type: data.type,
    capacity: data.capacity,
    matchConfig: data.matchConfig || {
      capacity: data.capacity,
      modalidad: "presencial" as const,
      scheduledDate: undefined,
      scheduledTime: undefined,
      title: undefined,
    },
    sinkConfig: data.sinkConfig || {
      sinkType: "podium" as const,
      places: 3,
    },
  });

  // Sincronizar formData solo cuando cambien las propiedades relevantes para el formulario
  useEffect(() => {
    setFormData({
      type: data.type,
      capacity: data.capacity,
      matchConfig: data.matchConfig || {
        capacity: data.capacity,
        modalidad: "presencial" as const,
        scheduledDate: undefined,
        scheduledTime: undefined,
        title: undefined,
      },
      sinkConfig: data.sinkConfig || {
        sinkType: "podium" as const,
        places: 3,
      },
    });
  }, [data.type, data.capacity, data.matchConfig, data.sinkConfig]);



  // Validación del formulario (solo para nodos match)
  const validation =
    formData.type === "match"
      ? validateNodeForm(
          formData.type,
          formData.capacity,
          undefined, // No hay sinkConfig
          formData.matchConfig,
          data.id,
          allNodes
        )
      : { isValid: true, errors: {} };

  // Validación adicional del esport para nodos match
  const esportValidation = useMemo(() => {
    if (formData.type === "match") {
      return validateMatchForEsport(esport, formData.capacity, formData.capacity);
    }
    return { isValid: true, errors: [] };
  }, [esport, formData.type, formData.capacity]);

  // Combinar validaciones
  const combinedValidation = useMemo(() => {
    if (formData.type === "match") {
      const isFormValid = validation.isValid;
      const isEsportValid = esportValidation.isValid;
      
      return {
        isValid: isFormValid && isEsportValid,
        errors: {
          ...validation.errors,
          esport: esportValidation.errors
        }
      };
    }
    return validation;
  }, [validation, esportValidation, formData.type]);

  // Actualizar datos del nodo (para nodos match y podios)
  const handleUpdate = useCallback(
    (field: string, value: unknown) => {
      const updates = { [field]: value };
      setFormData((prev) => ({ ...prev, ...updates }));

      // Validar que el cambio no rompa la estructura mínima del torneo
      if (field === "type") {
        const updatedFormData = { ...formData, ...updates };
        const simulatedNode = { ...data, ...updatedFormData };
        const otherNodes = allNodes.filter((n) => n.id !== data.id);
        const allNodesWithUpdate = [...otherNodes, simulatedNode];

        const validation = validateTournamentStructure(allNodesWithUpdate);
        if (!validation.isValid) {
          alert(validation.error);
          // Revertir el cambio
          setFormData((prev) => ({ ...prev }));
          return;
        }
      }

      // Validar cambios de capacidad según el esport
      if (field === "capacity" && formData.type === "match") {
        const newCapacity = value as number;
        const esportValidation = validateMatchForEsport(esport, newCapacity, newCapacity);
        if (!esportValidation.isValid) {
          alert(`Error de validación del esport: ${esportValidation.errors.join(", ")}`);
          // Revertir el cambio
          setFormData((prev) => ({ ...prev }));
          return;
        }
      }

      if (onChange) {
        // Incluir matchConfig en las actualizaciones si es un nodo de match
        if (field === "matchConfig") {
          onChange({ ...updates, matchConfig: value as MatchConfiguration });
        } else if (field === "sinkConfig") {
          onChange({ ...updates, sinkConfig: value as SinkConfiguration });
        } else {
          onChange(updates);
        }
      }
    },
    [onChange, formData, data, allNodes, esport]
  );

  // Guardar cambios y salir del modo edición
  const handleSave = useCallback(() => {
    if (!combinedValidation.isValid) return;

    if (onChange) {
      onChange({
        ...formData,
        editable: false,
      });
    }
    // Desactivar la edición automáticamente
    onStopEditing?.();
  }, [formData, combinedValidation.isValid, onChange, onStopEditing]);

  // Cancelar edición y revertir cambios
  const handleCancel = useCallback(() => {
    setFormData({
      type: data.type,
      capacity: data.capacity,
      matchConfig: data.matchConfig || {
        capacity: data.capacity,
        modalidad: "presencial" as const,
        scheduledDate: undefined,
        scheduledTime: undefined,
      },
      sinkConfig: data.sinkConfig || {
        sinkType: "podium" as const,
        places: 3,
      },
    });
    // Desactivar la edición automáticamente
    onStopEditing?.();
  }, [data, onStopEditing]);

  // Configuración visual por tipo de nodo
  const getNodeConfig = () => {
    if (formData.type === "match") {
      return {
        border: "border-emerald-200",
        text: "text-emerald-800",
        accent: "bg-emerald-500",
        icon: "M",
      };
    } else if (data.type === "sink") {
      // Configuración específica según el tipo de sink
      if (data.sinkConfig?.sinkType === "podium") {
        return {
          border: "border-yellow-200",
          text: "text-yellow-800",
          accent: "bg-yellow-500",
          icon: "P",
        };
      } else if (data.sinkConfig?.sinkType === "disqualification") {
        return {
          border: "border-red-200",
          text: "text-red-800",
          accent: "bg-red-500",
          icon: "E",
        };
      } else {
        // Fallback para otros tipos de sink
        return {
          border: "border-gray-200",
          text: "text-gray-800",
          accent: "bg-gray-500",
          icon: "S",
        };
      }
    }
    // Fallback genérico
    return {
      border: "border-gray-200",
      text: "text-gray-800",
      accent: "bg-gray-500",
      icon: "?",
    };
  };

  const config = getNodeConfig();

  // Generar handles dinámicamente para nodos podio y eliminación
  const generateSinkHandles = () => {
    if (data.type === "sink") {
      if (data.sinkConfig?.sinkType === "podium") {
        const places = data.sinkConfig.places || 3;
        return Array.from({ length: places }, (_, index) => {
          const position = index + 1;
          let title = "";
          if (position === 1) title = "🥇 1º Lugar";
          else if (position === 2) title = "🥈 2º Lugar";
          else if (position === 3) title = "🥉 3º Lugar";
          else title = `${position}º Lugar`;
          
          // Calcular posición vertical para distribuir los handles uniformemente
          // Usar porcentajes de 0 a 100 para cubrir toda la altura del nodo
          // Ajustar para evitar superposición con el contenido del nodo
          const startOffset = 15; // Comenzar después del header
          const endOffset = 25; // Terminar antes del contenido inferior
          const availableHeight = 100 - startOffset - endOffset;
          const topPosition = startOffset + (availableHeight * (index + 1)) / (places + 1);
          
          return (
            <LabeledHandle
              key={`podium-${index}`}
              id={`podium-${index}`}
              title={title}
              type="target"
              position={Position.Left}
              isConnectable={isConnectable}
              isConnectableStart={false}
              isConnectableEnd={true}
              style={{ 
                width: 25, 
                height: 25,
                top: `${topPosition}%`,
                transform: 'translateY(-50%)',
                position: 'absolute'
              }}
            />
          );
        });
      } else if (data.sinkConfig?.sinkType === "disqualification") {
        // Handle único para nodos de eliminación
        return (
          <LabeledHandle
            key="elimination"
            id="elimination"
            title="Eliminación"
            type="target"
            position={Position.Left}
            isConnectable={isConnectable}
            isConnectableStart={false}
            isConnectableEnd={true}
            style={{ 
              width: 25, 
              height: 25,
              top: "50%",
              transform: 'translateY(-50%)',
              position: 'absolute'
            }}
          />
        );
      }
    }
    return null;
  };

  return (
    <div
      className={`
        flex flex-row bg-background border-2 min-w-48 ${
          config.border
        } rounded-lg shadow-sm
        hover:shadow-md transition-all duration-200
        ${isEditing ? "ring-2 ring-blue-400 ring-opacity-50" : ""}
        ${
          isEditing
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-grab active:cursor-grabbing"
        }
       
      `}
      onClick={() => {
        // Solo los nodos no-match y no-sink se pueden editar con clic general
        if (
          !isEditing &&
          onStartEditing &&
          formData.type !== "match" &&
          formData.type !== "sink"
        ) {
          onStartEditing();
        }
      }}
    >
      {/* Header del nodo con toggle de edición */}
      <div className={`flex flex-row p-2 gap-2`}>
        <div
          className={`flex items-center ${
            formData.type === "match" && !isEditing
              ? "justify-center"
              : "justify-between"
          } ${formData.type === "match" && !isEditing ? "" : "mb-3"}`}
        >
          <div className="flex items-center">
            {/* Para nodos sink, mostrar el cuadrado de color a la derecha */}
            {data.type === "sink" ? (
              <>
               
                <div
                  className={`${config.accent} w-8 h-8 rounded-lg flex items-center justify-center ml-3`}
                >
                  <span className="text-white text-sm font-bold">
                    {config.icon}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div
                  className={`${config.accent} w-8 h-8 rounded-lg flex items-center justify-center`}
                >
                  <span className="text-white text-sm font-bold">
                    {config.icon}
                  </span>
                </div>
                <div>
                  <div className={`font-semibold text-sm ${config.text}`}>
                    {formData.type.toUpperCase()}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Botón de edición para nodos match y podios */}
          {(formData.type === "match" || (data.type === "sink" && data.sinkConfig?.sinkType === "podium")) && !isEditing && onStartEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartEditing?.();
              }}
              className="absolute top-1 right-1 px-2 py-1 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm text-xs font-medium text-gray-700"
            >
              {data.type === "sink" && data.sinkConfig?.sinkType === "podium" ? (
                `${data.sinkConfig.places || 3} pos`
              ) : (
                <PencilIcon className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Información del nodo match cuando no está en edición */}
        {formData.type === "match" && !isEditing && formData.matchConfig && (
          <div className="text-left">
            {formData.matchConfig.title && (
              <div className="text-sm text-emerald-700 font-semibold mb-1">
                {formData.matchConfig.title}
              </div>
            )}
            <div className="text-xs text-emerald-600 font-medium mb-1">
              {formData.matchConfig.modalidad === "presencial"
                ? "Presencial"
                : "Online"}
            </div>
            <div className="text-nowrap text-xs text-emerald-600 mb-2">
              {formData.matchConfig.capacity} equipos
            </div>
            {formData.matchConfig.scheduledDate && (
              <div className="text-xs text-emerald-600 mb-2">
                📅 {formData.matchConfig.scheduledDate.toLocaleDateString()}
                {formData.matchConfig.scheduledTime && (
                  <span> 🕐 {formData.matchConfig.scheduledTime}</span>
                )}
              </div>
            )}

            {/* Slots de equipos */}
            <div className="space-y-1">
              {Array.from(
                { length: formData.matchConfig.capacity || 2 },
                (_, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 text-xs border border-emerald-600 rounded  text-emerald-700 text-center"
                  >
                    Equipo {index + 1}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Formulario de edición */}
      {isEditing && (
        <div className="p-2 ">
          <div>
            {formData.type === "match" ? (
              <MatchConfigEditor
                config={formData.matchConfig}
                onChange={(config) => handleUpdate("matchConfig", config)}
                esport={esport}
              />
            ) : data.type === "sink" && data.sinkConfig?.sinkType === "podium" ? (
              <PodiumConfigEditor
                config={formData.sinkConfig}
                onChange={(config) => handleUpdate("sinkConfig", config)}
              />
            ) : null}

            {/* Botones de acción */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCancel}
                className="flex flex-row gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <XIcon className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!combinedValidation.isValid}
                className={`
                  flex flex-row gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${
                    combinedValidation.isValid
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }
                `}
              >
                <SaveIcon className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

     

      {/* Handles para conexiones - siempre visibles y más grandes */}
      {data.type === "sink" ? (
        // Handles para nodos sink (podio y eliminación)
        generateSinkHandles()
      ) : (
        // Handle único para otros tipos de nodos
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          isConnectableStart={false}
          isConnectableEnd={true}
          style={{ width: 15, height: 15 }}
        />
      )}
      
      {formData.type !== "sink" && (
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          style={{ width: 15, height: 15 }}
        />
      )}
    </div>
  );
}
