# 🏆 Tournament Graph Editor

Un editor visual interactivo para diseñar flujos de torneos usando React Flow. Permite crear estructuras de torneos complejas con nodos editables y edges condicionales.

![Tournament Editor](https://img.shields.io/badge/Status-Completed-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue) ![React](https://img.shields.io/badge/React-19.1.1-61dafb)

## ✨ Características

### 🎯 Funcionalidades Principales
- **Nodos Editables**: Configurar matches, aggregators y sinks con formularios interactivos
- **Edges Condicionales**: Definir reglas de flujo con operadores matemáticos (`>=`, `<=`, `==`, etc.)
- **Creación Interactiva**: Agregar nodos y conectarlos con drag & drop
- **Exportación JSON**: Guardar configuraciones completas del torneo
- **Modo Dual**: Toggle entre Editor y Visualizador

### 🛠️ Tipos de Nodos
- **Match**: Nodos donde compiten los participantes (configurable: capacidad, esport)
- **Aggregator**: Consolidan resultados de múltiples matches  
- **Sink**: Terminales finales del torneo:
  - 🚫 **Disqualification**: Con razón específica
  - ✅ **Qualification**: Con threshold de puntaje
  - 🏆 **Podium**: Con posición específica

### ⚡ Condiciones de Edges
Configura cuándo los participantes fluyen por cada edge:
- `points >= 100`: Mínimo 100 puntos para avanzar
- `position <= 3`: Solo top 3 posiciones
- `score == 0`: Exact score matching
- Y más combinaciones...

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js 18+ 
- npm o pnpm

### Instalación
```bash
# Clonar repositorio
git clone <repository-url>
cd debug_react_flow

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

### Build para Producción
```bash
npm run build
npm run preview
```

## 📖 Guía de Uso

### 1. Modo Editor vs Visualizador

**Modo Editor (📝)**: Permite editar y crear
- Agregar nuevos nodos
- Configurar propiedades
- Conectar nodos con edges
- Definir condiciones

**Modo Visualizador (👁️)**: Solo lectura
- Ver estructura del torneo
- Navegar con minimap
- Zoom y pan

### 2. Crear un Torneo

#### Paso 1: Agregar Nodos
1. Click en `+ Match`, `+ Aggregator`, o `+ Sink`
2. El nodo aparece en el canvas
3. Arrastra para posicionar

#### Paso 2: Configurar Nodos
1. Click en el botón ✏️ Edit en cualquier nodo
2. Configura las propiedades:
   - **Tipo**: Match, Aggregator, Sink
   - **Capacidad**: Número de slots (para Match/Aggregator)
   - **Esport**: Categoría del juego
   - **Configuración Sink**: Tipo y parámetros específicos

#### Paso 3: Conectar Nodos
1. Arrastra desde el handle derecho (●) de un nodo
2. Conecta al handle izquierdo (●) de otro nodo
3. Se crea un edge automáticamente

#### Paso 4: Configurar Edges
1. Click en ✏️ Edit en cualquier edge
2. Define la condición:
   - **Campo**: points, position, score
   - **Operador**: >=, <=, ==, !=, >, <
   - **Valor**: número objetivo
3. Preview en tiempo real: `points >= 50`

#### Paso 5: Exportar
1. Click en 💾 Export JSON
2. Se descarga automáticamente el archivo de configuración
3. Úsalo en tu sistema de gestión de torneos

### 3. Ejemplos de Configuración

#### Torneo de Eliminación Simple
```
Match A (2 players) → [position <= 1] → Final Match
Match B (2 players) → [position <= 1] → Final Match
Final Match → [position == 1] → Champion Sink
Final Match → [position == 2] → Runner-up Sink
```

#### Sistema de Calificación por Puntos
```
Match 1 → [points >= 80] → Qualification Sink
Match 1 → [points < 80] → Elimination Sink
Match 2 → [points >= 80] → Qualification Sink  
Match 2 → [points < 80] → Elimination Sink
```

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **React 19.1.1**: Framework principal
- **TypeScript**: Tipado estático completo
- **React Flow 11.11.4**: Motor de grafos interactivos
- **Tailwind CSS**: Styling moderno
- **Dagre**: Layout automático de grafos
- **Vite**: Build tool optimizado

### Estructura de Componentes
```
App.tsx                    # Aplicación principal
├── TournamentEditor.tsx   # Editor interactivo
├── TournamentGraphView.tsx # Visualizador (legacy)
└── components/
    ├── FormComponents.tsx  # Formularios base
    ├── EditableNode.tsx   # Nodos editables
    └── EditableEdge.tsx   # Edges condicionales
```

### Tipos TypeScript
Todas las interfaces están completamente tipadas:
- `GraphNode`: Estructura de nodos
- `GraphEdge`: Estructura de edges
- `EdgeCondition`: Condiciones matemáticas
- `SinkConfiguration`: Configuración de terminales
- `TournamentGraph`: Grafo completo

## 🎨 Personalización

### Temas y Styling
Los colores están configurados en Tailwind CSS y pueden personalizarse:
- **Match Nodes**: Verde esmeralda
- **Aggregator Nodes**: Azul
- **Sink Nodes**: Púrpura

### Extender Funcionalidad
El sistema es modular y permite:
- Agregar nuevos tipos de nodos
- Crear operadores de condición personalizados
- Implementar validaciones específicas
- Integrar con APIs externas

## 📋 Formato de Exportación

El JSON exportado contiene:
```json
{
  "version": 1,
  "tournamentId": "string",
  "nodes": [...],
  "edges": [...],
  "metadata": {
    "createdAt": "ISO Date",
    "lastModified": "ISO Date",
    "exportedAt": "ISO Date"
  }
}
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 🙋‍♂️ Soporte

Para preguntas o issues:
1. Revisa la documentación en `/memory-bank/`
2. Abre un issue en GitHub
3. Contacta al equipo de desarrollo

---

**¡Diseña torneos épicos con facilidad! 🚀**