import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Trophy, Users, Zap, ArrowRight, Info } from "lucide-react";
import type { TournamentTemplate } from "../config/templates";
import type { EsportType } from "../types";
import { getTemplatesByEsport } from "../config/templates";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
interface TemplateSelectorProps {
  esport: EsportType;
  onTemplateSelect: (template: TournamentTemplate) => void;
  className?: string;
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

export default function TemplateSelector({
  esport,
  onTemplateSelect,
  className = "",
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    TournamentTemplate["category"] | "all"
  >("all");
  const [showInfo, setShowInfo] = useState(false);

  // Filtrar templates por esport y categoría
  const availableTemplates = useMemo(() => {
    let templates = getTemplatesByEsport(esport);

    if (selectedCategory !== "all") {
      templates = templates.filter((t) => t.category === selectedCategory);
    }

    return templates;
  }, [esport, selectedCategory]);

  // Obtener todas las categorías disponibles para el esport
  const availableCategories = useMemo(() => {
    const categories = new Set(
      getTemplatesByEsport(esport).map((t) => t.category)
    );
    return Array.from(categories);
  }, [esport]);

  const handleTemplateSelect = (template: TournamentTemplate) => {
    onTemplateSelect(template);
  };

  const getCategoryIcon = (category: TournamentTemplate["category"]) => {
    const IconComponent = categoryIcons[category];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header con información */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Templates de Torneos
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInfo(!showInfo)}
            className="p-1 h-auto"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>

        {/* Selector de categoría */}
        <Select
          value={selectedCategory}
          onValueChange={(value: TournamentTemplate["category"] | "all") =>
            setSelectedCategory(value)
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {availableCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {categoryNames[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Información sobre templates */}
      {showInfo && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-900 text-sm">
              ¿Qué son los Templates?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-blue-800 text-sm">
              Los templates son estructuras predefinidas de torneos que incluyen
              nodos de match, conexiones y podios configurados automáticamente.
              Selecciona uno para crear instantáneamente un torneo completo.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grid de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableTemplates.map((template) => (
          <Card
            key={template.id}
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300"
            onClick={() => handleTemplateSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(template.category)}
                  <Badge
                    variant="secondary"
                    className={`${categoryColors[template.category]} text-xs`}
                  >
                    {categoryNames[template.category]}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1 text-gray-500">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {template.participants}
                  </span>
                </div>
              </div>
              <CardTitle className="text-base leading-tight">
                {template.name}
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0">
              <CardDescription className="text-sm text-gray-600 mb-4">
                {template.description}
              </CardDescription>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Compatible con:</span>
                  <div className="flex space-x-1">
                    {template.esports.slice(0, 3).map((esp) => (
                      <Badge key={esp} variant="outline" className="text-xs">
                        {esp.toUpperCase()}
                      </Badge>
                    ))}
                    {template.esports.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.esports.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  className="ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTemplateSelect(template);
                  }}
                >
                  Usar Template
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mensaje cuando no hay templates disponibles */}
      {availableTemplates.length === 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium mb-2">
                No hay templates disponibles
              </p>
              <p className="text-sm">
                {selectedCategory !== "all"
                  ? `No hay templates de ${
                      categoryNames[selectedCategory]
                    } para ${esport.toUpperCase()}`
                  : `No hay templates disponibles para ${esport.toUpperCase()}`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
