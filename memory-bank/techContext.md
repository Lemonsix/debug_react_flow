# Tournament Graph Editor - Technical Context

## Stack Tecnológico

### Core Dependencies
- **React 19.1.1**: Framework principal con hooks modernos
- **TypeScript 5.8.3**: Tipado estático para mayor robustez
- **React Flow 11.11.4**: Librería de grafos interactivos
- **@xyflow/react 12.8.3**: Versión moderna de React Flow
- **Dagre 0.8.5**: Layout automático de grafos dirigidos

### Styling y UI
- **Tailwind CSS 4.1.12**: Framework CSS utility-first
- **PostCSS**: Procesamiento de CSS con autoprefixer

### Herramientas de Desarrollo
- **Vite 7.1.2**: Build tool moderno y rápido
- **ESLint 9.33.0**: Linting con configuración moderna
- **TypeScript ESLint**: Reglas específicas para TypeScript

## Configuración de Desarrollo

### Estructura de Archivos
```
src/
├── types.ts              # Definiciones de tipos
├── TournamentGraphView.tsx # Componente principal (actual)
├── App.tsx               # Entry point
├── data.sample.ts        # Datos de ejemplo
└── assets/              # Recursos estáticos
```

### Scripts Disponibles
- `npm run dev`: Servidor de desarrollo con hot reload
- `npm run build`: Build de producción optimizado
- `npm run lint`: Análisis de código con ESLint
- `npm run preview`: Preview del build de producción

## Restricciones Técnicas

### React Flow Constraints
- **Node Types**: Limitado a tipos registrados en nodeTypes
- **Handle Positions**: Posiciones fijas (Left/Right/Top/Bottom)
- **Layout**: Dagre maneja posicionamiento automático
- **Performance**: Re-renders pueden ser costosos con grafos grandes

### TypeScript Considerations
- **Strict Mode**: Configuración estricta habilitada
- **Type Safety**: Todos los componentes deben estar tipados
- **Interface Evolution**: Mantener compatibilidad con tipos existentes

### Browser Support
- **Modern Browsers**: ES2020+ features requeridas
- **Canvas Support**: HTML5 Canvas necesario para React Flow
- **Event Handling**: Drag & Drop APIs requeridas

## Dependencias y Integraciones

### React Flow Ecosystem
- **Core**: Funcionalidad básica de nodos y edges
- **Background**: Grid background para el canvas
- **Controls**: Zoom, pan, fit view controls
- **MiniMap**: Vista miniatura del grafo completo

### Dagre Layout Engine
- **Directed Graphs**: Especializado en grafos dirigidos
- **Hierarchical Layout**: Layout automático de arriba-abajo/izquierda-derecha
- **Node Spacing**: Configuración de separación entre nodos

### Estado Actual vs. Objetivo
**Actual**: Visualizador de solo lectura con datos estáticos
**Objetivo**: Editor interactivo con persistencia y validación

## Consideraciones de Migración
- **Mantener API**: No romper interfaces existentes
- **Gradual Enhancement**: Agregar funcionalidades incrementalmente  
- **Backward Compatibility**: Asegurar que datos existentes funcionen
- **Testing Strategy**: Unit tests para componentes críticos
