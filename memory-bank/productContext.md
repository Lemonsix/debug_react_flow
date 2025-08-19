# Tournament Graph Editor - Product Context

## Problema que Resuelve
El diseño de torneos complejos requiere herramientas visuales intuitivas para definir flujos de eliminación, calificación y podios. Los organizadores necesitan:

1. **Flexibilidad de Diseño**: Crear estructuras de torneos personalizadas más allá de brackets tradicionales
2. **Lógica Condicional**: Definir reglas específicas para el flujo de participantes basadas en puntajes y resultados
3. **Visualización Clara**: Ver y entender el flujo completo del torneo antes de ejecutarlo
4. **Configuración Intuitiva**: Modificar reglas sin código técnico

## Funcionamiento Esperado

### Para Organizadores de Torneos
- Arrastrar y soltar nodos para crear estructuras de torneo
- Configurar cada match con reglas específicas
- Definir condiciones de avance entre rounds
- Exportar configuración para sistemas de gestión

### Para Administradores de Plataforma  
- Importar diseños de torneos creados visualmente
- Ejecutar lógica de flujo automáticamente
- Manejar excepciones y casos especiales
- Integrar con sistemas de puntuación existentes

## Experiencia del Usuario

### Flujo Principal
1. **Crear Nodos**: Agregar matches, aggregators y sinks al lienzo
2. **Configurar Nodos**: Definir capacidad, tipo y reglas específicas
3. **Conectar Flujo**: Arrastrar conexiones entre nodos
4. **Definir Condiciones**: Establecer reglas de filtrado en cada edge
5. **Validar Diseño**: Verificar que el flujo es completo y lógico
6. **Exportar**: Generar JSON para implementación

### Características de UX
- **Feedback Visual**: Indicadores claros de estado y validación
- **Drag & Drop**: Interacciones naturales para construcción
- **Formularios Contextuales**: Configuración in-place sin ventanas modales
- **Preview en Tiempo Real**: Ver efectos de cambios inmediatamente

## Objetivos de Negocio
- Democratizar el diseño de torneos complejos
- Reducir tiempo de configuración manual
- Minimizar errores en flujos de torneo
- Facilitar innovación en formatos de competencia
