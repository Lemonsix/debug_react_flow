import { useCallback, useEffect, useState, useMemo } from "react";
import type { GraphNode, EsportType } from "../../types";
import { isSinkConfiguration } from "../../types";
import { validateNodeForm } from "../../utils/validation";
import { validateMatchForEsport } from "../../config/esports";

export interface UseBaseNodeProps {
  data: GraphNode;
  onChange?: (updates: Partial<GraphNode>) => void;
  onStopEditing?: () => void;
  allNodes?: GraphNode[];
  esport: EsportType;
}

export function useBaseNode({
  data,
  onChange,
  onStopEditing,
  allNodes = [],
  esport,
}: UseBaseNodeProps) {
  const [formData, setFormData] = useState({
    type: data.type,
    capacity: data.capacity,
    config:
      data.config ||
      (data.type === "match"
        ? {
            capacity: data.capacity,
            modalidad: "presencial" as const,
            scheduledDate: undefined,
            scheduledTime: undefined,
            title: undefined,
          }
        : {
            sinkType: "podium" as const,
            places: 3,
          }),
  });

  // Sincronizar formData solo cuando cambien las propiedades relevantes para el formulario
  useEffect(() => {
    setFormData({
      type: data.type,
      capacity: data.capacity,
      config:
        data.config ||
        (data.type === "match"
          ? {
              capacity: data.capacity,
              modalidad: "presencial" as const,
              scheduledDate: undefined,
              scheduledTime: undefined,
              title: undefined,
            }
          : {
              sinkType: "podium" as const,
              places: 3,
            }),
    });
  }, [data.type, data.capacity, data.config, data.config]);

  // Validación del formulario (solo para nodos match)
  const validation =
    formData.type === "match"
      ? validateNodeForm(
          formData.type,
          formData.capacity,
          undefined, // No hay sinkConfig
          formData.type === "match"
            ? (formData.config as import("../../types").MatchConfiguration)
            : undefined,
          data.id,
          allNodes
        )
      : { isValid: true, errors: {} };

  // Validación adicional del esport para nodos match
  const esportValidation = useMemo(() => {
    if (formData.type === "match") {
      return validateMatchForEsport(
        esport,
        formData.capacity,
        formData.capacity
      );
    }
    return { isValid: true, errors: [] };
  }, [esport, formData.type, formData.capacity]);

  // Combinar validaciones
  const combinedValidation = useMemo(() => {
    if (formData.type === "match") {
      return {
        isValid: validation.isValid && esportValidation.isValid,
        errors: { ...validation.errors, esport: esportValidation.errors },
      };
    }
    return { isValid: true, errors: {} };
  }, [validation, esportValidation, formData.type]);

  // Función para actualizar el formulario
  const handleUpdate = useCallback(
    (field: keyof typeof formData, value: unknown) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  // Función para guardar cambios
  const handleSave = useCallback(() => {
    if (onChange) {
      const updates: Partial<GraphNode> = {
        type: formData.type,
        capacity: formData.capacity,
      };

      if (formData.type === "match") {
        updates.config = formData.config;
      } else if (data.type === "sink") {
        updates.config = formData.config;
      }

      onChange(updates);
    }
    onStopEditing?.();
  }, [onChange, onStopEditing, formData, data.type]);

  // Función para cancelar edición
  const handleCancel = useCallback(() => {
    setFormData({
      type: data.type,
      capacity: data.capacity,
      config:
        data.config ||
        (data.type === "match"
          ? {
              capacity: data.capacity,
              modalidad: "presencial" as const,
              scheduledDate: undefined,
              scheduledTime: undefined,
              title: undefined,
            }
          : {
              sinkType: "podium" as const,
              places: 3,
            }),
    });
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
      if (
        data.config &&
        isSinkConfiguration(data.config) &&
        data.config.sinkType === "podium"
      ) {
        return {
          border: "border-yellow-200",
          text: "text-yellow-800",
          accent: "bg-yellow-500",
          icon: "P",
        };
      } else if (
        data.config &&
        isSinkConfiguration(data.config) &&
        data.config.sinkType === "eliminacion"
      ) {
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

  return {
    formData,
    config,
    combinedValidation,
    handleUpdate,
    handleSave,
    handleCancel,
  };
}
