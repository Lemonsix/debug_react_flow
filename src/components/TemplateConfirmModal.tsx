import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Trophy,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import type { TournamentTemplate } from "../config/templates";
import type { EsportType } from "../types";

interface TemplateConfirmModalProps {
  template: TournamentTemplate | null;
  esport: EsportType;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (template: TournamentTemplate) => void;
}

const categoryIcons = {
  eliminacion: Trophy,
  suizo: Users,
  "eliminacion-doble": Zap,
};

const categoryColors = {
  eliminacion: "bg-blue-100 text-blue-800 border-blue-200",
  suizo: "bg-green-100 text-green-800 border-green-200",
  "eliminacion-doble": "bg-purple-100 text-purple-800 border-purple-200",
};

const categoryNames = {
  eliminacion: "Eliminación Directa",
  suizo: "Sistema Suizo",
  "eliminacion-doble": "Eliminación Doble",
};

export default function TemplateConfirmModal({
  template,
  esport,
  isOpen,
  onClose,
  onConfirm,
}: TemplateConfirmModalProps) {
  if (!template) return null;

  const handleConfirm = () => {
    onConfirm(template);
    onClose();
  };

  const getCategoryIcon = (category: TournamentTemplate["category"]) => {
    const IconComponent = categoryIcons[category];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
  };

  const getNodeCount = () => {
    // Contar nodos por tipo basado en el template
    const matchNodes = template.participants / 2; // Aproximación
    const podiumNodes = 3; // Siempre 3 podios

    return {
      match: Math.ceil(matchNodes),
      podium: podiumNodes,
      total: Math.ceil(matchNodes) + podiumNodes,
    };
  };

  const getEdgeCount = () => {
    // Aproximación del número de edges basado en el template
    const matchNodes = Math.ceil(template.participants / 2);
    return matchNodes + 2; // Conexiones básicas + podios
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            {getCategoryIcon(template.category)}
            <div>
              <DialogTitle className="text-xl">
                Aplicar Template: {template.name}
              </DialogTitle>
              <DialogDescription className="text-base">
                {template.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del template */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Categoría:
                </span>
                <Badge
                  variant="secondary"
                  className={`${categoryColors[template.category]} text-sm`}
                >
                  {categoryNames[template.category]}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Participantes:
                </span>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{template.participants}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Esport:
                </span>
                <Badge variant="outline" className="text-sm">
                  {esport.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Nodos de Match:
                </span>
                <span className="font-medium">{getNodeCount().match}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Nodos de Podio:
                </span>
                <span className="font-medium">{getNodeCount().podium}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Conexiones:
                </span>
                <span className="font-medium">{getEdgeCount()}</span>
              </div>
            </div>
          </div>

          {/* Compatibilidad */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">
                Compatible con este esport
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Este template está optimizado para {esport.toUpperCase()} y se
              adaptará automáticamente a las reglas y configuraciones
              específicas del deporte.
            </p>
          </div>

          {/* Advertencia */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-amber-800">Importante</span>
            </div>
            <p className="text-sm text-amber-700">
              Al aplicar este template, se reemplazará completamente el torneo
              actual. Asegúrate de guardar cualquier trabajo previo antes de
              continuar.
            </p>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">¿Qué incluye?</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Estructura completa del torneo con nodos posicionados</li>
              <li>• Conexiones automáticas entre nodos</li>
              <li>• Configuración de podios (1er, 2do, 3er lugar)</li>
              <li>• Títulos descriptivos para cada match</li>
              <li>• Configuración optimizada para el esport seleccionado</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Aplicar Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
