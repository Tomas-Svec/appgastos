# AppGastos - Contexto del Proyecto

## Descripción General
Aplicación móvil híbrida para gestión de gastos personales con presupuesto mensual, autenticación biométrica y seguimiento de cuotas. Desarrollada con Ionic 8 + Angular 20.

## Stack Tecnológico

### Framework y Librerías Core
- **Angular**: 20.0.0 (última versión estable)
- **Ionic**: 8.0.0
- **Capacitor**: 7.4.4
- **TypeScript**: 5.8.0
- **RxJS**: 7.8.0

### Base de Datos y Almacenamiento
- **SQLite**: @capacitor-community/sqlite 7.0.2 (nativo)
- **LocalStorage**: Fallback para plataforma web
- **Estrategia**: Dual-mode (nativo + web)

### UI y Visualización
- **Estilo**: iOS-first design
- **CSS Framework**: Tailwind CSS 3.4.18
- **Gráficos**: Chart.js 4.5.1
- **Iconos**: Ionicons 7.0.0

### Capacidades Nativas
- **Biometría**: capacitor-native-biometric 4.2.2
- **Haptics**: @capacitor/haptics 7.0.2
- **Status Bar**: @capacitor/status-bar 7.0.3
- **Keyboard**: @capacitor/keyboard 7.0.3

### Testing y Calidad
- **Framework**: Jasmine 5.1.0 + Karma 6.4.0
- **Linting**: ESLint 9.16.0 + Angular ESLint 20.0.0
- **Type Checking**: TypeScript strict mode habilitado

## Estructura del Proyecto

```
src/app/
├── home/                    # Página principal
├── pages/                   # Páginas de la aplicación
│   ├── login/              # Autenticación (login + biometría)
│   ├── register/           # Registro de usuarios
│   └── dashboard/          # Panel principal con métricas
├── services/               # Servicios (providedIn: 'root')
│   ├── auth.service.ts    # Autenticación y sesiones
│   ├── database.service.ts # Conexión SQLite/localStorage
│   ├── user.service.ts    # Gestión de usuarios
│   ├── expense.service.ts # CRUD de gastos
│   ├── category.service.ts # Categorías de gastos
│   └── audit.service.ts   # Auditoría de cambios
└── models/                 # Interfaces y tipos
    ├── user.model.ts
    ├── expense.model.ts
    ├── category.model.ts
    ├── audit.model.ts
    └── index.ts           # Barrel export
```

## Arquitectura y Patrones

### Base de Datos
- **Schema**: 4 tablas principales (users, expenses, categories, audits)
- **Relaciones**: Foreign keys con CASCADE DELETE
- **Migraciones**: Versionado en database.service.ts
- **Fallback Web**: localStorage con misma estructura JSON
- **Inicialización**: Lazy initialization con `ensureInitialized()`

### Servicios
- Todos usan `providedIn: 'root'` (singleton global)
- Inyección de dependencias mediante constructor
- Métodos async/await para operaciones de BD
- Manejo de errores con try-catch y logging

### Modelos
- Interfaces TypeScript (no clases)
- Sin prefijo "I" (usar `Expense`, no `IExpense`)
- Propiedades opcionales con `?` cuando corresponda
- Exports centralizados vía barrel (models/index.ts)

## Convenciones de Código

### TypeScript
- **Indentación**: 2 espacios (no tabs)
- **Strict Mode**: Habilitado (`strict: true`)
- **Type Safety**: Sin `any` implícito
- **Naming**:
  - Interfaces: PascalCase sin prefijo (Expense, User)
  - Servicios: camelCase + sufijo "Service" (authService)
  - Componentes: kebab-case en archivos (login.page.ts)
  - Variables/métodos: camelCase (getUserById)
  - Constantes: SCREAMING_SNAKE_CASE (MAX_RETRIES)

### Angular
- **Componentes**: Arquitectura basada en signals (Angular 20+)
- **Ciclo de vida**: Usar hooks modernos (inject, effect, computed)
- **Formularios**: Reactive Forms con FormBuilder
- **Routing**: Lazy loading para todas las páginas
- **State**: Servicios + BehaviorSubject/signals (no NgRx)

### CSS/Styling
- **Approach**: Tailwind-first + variables CSS de Ionic
- **Responsive**: Mobile-first design (iOS style)
- **Theme**: Variables CSS en global.scss
- **Scoped Styles**: Solo cuando Tailwind no sea suficiente
- **Accesibilidad**: Siempre incluir labels ARIA

### Gestures e Interacciones iOS
- **ion-item-sliding**: Para swipe actions (delete, edit, archive)
- **Haptics**: Feedback táctil en acciones críticas (Haptics.impact())
- **Pull-to-refresh**: ion-refresher para actualizar datos
- **Infinite scroll**: ion-infinite-scroll para listas grandes
- **Transitions**: Animaciones suaves con CSS transforms (300ms ease-out)

### Base de Datos
- **Queries**: Usar placeholders `?` para prevenir SQL injection
- **Transacciones**: Wrap múltiples operaciones cuando sea necesario
- **Indexes**: Agregar en columnas frecuentemente consultadas
- **Audit Trail**: Registrar todas las operaciones CRUD importantes

## Focus Areas (Especialización Frontend)

### 1. Arquitectura de Componentes Angular
- **Signals**: Usar en lugar de BehaviorSubject cuando sea posible
- **Standalone Components**: Preferir sobre módulos NgModule
- **Composition**: Componentes pequeños, reutilizables y composables
- **Performance**:
  - Lazy loading de páginas/módulos
  - OnPush change detection cuando aplique
  - Memoización de computaciones costosas con `computed()`
  - Virtual scrolling para listas largas

### 2. Diseño Responsive (iOS-first)
- **Mobile-first**: Diseñar para 375px primero, luego escalar
- **Breakpoints Ionic**:
  - xs: 0-575px
  - sm: 576-767px
  - md: 768-991px
  - lg: 992px+
- **Touch Targets**: Mínimo 44×44px para elementos clickeables
- **Safe Areas**: Respetar notch/status bar con CSS variables

### 3. State Management
- **Servicios con Signals**: Para estado reactivo simple
- **RxJS Observables**: Para streams complejos y async
- **Local Storage**: Persistencia de preferencias de usuario
- **Session State**: AuthService mantiene usuario actual

### 4. Performance
- **Presupuesto de Rendimiento**:
  - First Contentful Paint < 1.5s
  - Time to Interactive < 3s
  - Lighthouse Score > 90
- **Optimizaciones**:
  - Code splitting por ruta
  - Lazy load de imágenes/gráficos
  - Debounce en búsquedas/filtros
  - Virtualization para listas grandes

### 5. Accesibilidad (WCAG 2.1 AA)
- **Semantic HTML**: Usar elementos nativos cuando sea posible
- **ARIA Labels**: Requeridos en todos los controles interactivos
- **Navegación Teclado**: Tab order lógico, focus visible
- **Contraste**: Mínimo 4.5:1 para texto normal
- **Screen Readers**: Testar con VoiceOver (iOS) / TalkBack (Android)

## Approach de Desarrollo

### 1. Component-First Thinking
- Identificar componentes reutilizables antes de codificar
- Extraer lógica común a servicios/composables
- Props/Inputs claramente tipados con interfaces
- Outputs mediante EventEmitter con tipos específicos

### 2. Mobile-First Responsive Design
- Diseñar para móvil primero, luego adaptar a tablet/desktop
- Usar Ionic Grid system para layouts responsive
- Testar en dispositivos reales, no solo emuladores
- Considerar orientación portrait y landscape

### 3. Type Safety con TypeScript
- Tipado estricto en todo el código (no `any`)
- Interfaces para todas las estructuras de datos
- Type guards para validaciones en runtime
- Generics cuando sea apropiado para reutilización

### 4. Semantic HTML y ARIA
- Elementos HTML semánticos (`<nav>`, `<main>`, `<section>`)
- Roles ARIA solo cuando HTML semántico no sea suficiente
- Labels descriptivos en formularios
- Alt text en todas las imágenes

### 5. Performance Budgets
- Monitorear bundle size (target: < 500KB initial)
- Lazy load rutas y componentes pesados
- Optimizar imágenes (WebP, lazy loading)
- Minimizar re-renders innecesarios

## Output Esperado

Cuando desarrolles features, siempre incluye:

### 1. Componente Angular Completo
```typescript
// Ejemplo de estructura esperada
import { Component, signal, inject } from '@angular/core';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent {
  private readonly service = inject(ExampleService);

  // Signals para estado reactivo
  data = signal<DataType[]>([]);

  // Métodos con tipos explícitos
  async loadData(): Promise<void> {
    // Implementation
  }
}
```

### 2. Solución de Styling
```scss
// Tailwind-first approach
<ion-button class="w-full py-3 text-lg font-semibold">
  Confirmar
</ion-button>

// O SCSS cuando Tailwind no sea suficiente
.custom-component {
  @apply flex items-center gap-4;

  &__title {
    @apply text-2xl font-bold;
  }
}
```

### 3. Gestión de Estado (si aplica)
```typescript
// Servicio con signals
export class StateService {
  private _data = signal<Data[]>([]);
  readonly data = this._data.asReadonly();

  async updateData(newData: Data): Promise<void> {
    // Implementation
  }
}
```

### 4. Estructura de Tests Básica
```typescript
describe('ExampleComponent', () => {
  let component: ExampleComponent;
  let fixture: ComponentFixture<ExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExampleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ExampleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### 5. Checklist de Accesibilidad
- [ ] Todos los botones tienen labels descriptivos
- [ ] Formularios tienen labels asociados con `for`/`id`
- [ ] Imágenes tienen `alt` text
- [ ] Contraste de color cumple WCAG AA
- [ ] Navegación por teclado funciona correctamente
- [ ] Screen reader anuncia cambios de estado

### 6. Consideraciones de Performance
- [ ] Lazy loading implementado donde corresponda
- [ ] Signals/memoization para datos calculados
- [ ] Virtual scrolling en listas grandes (>50 items)
- [ ] Imágenes optimizadas (WebP, tamaño apropiado)
- [ ] Debounce en inputs de búsqueda

## Reglas Importantes

### Seguridad
- ✅ Siempre usar queries parametrizadas (prevenir SQL injection)
- ✅ Validar inputs en frontend Y backend
- ✅ No almacenar contraseñas en texto plano (usar bcrypt/similar)
- ✅ Sanitizar HTML user-generated con DomSanitizer
- ❌ NUNCA exponer API keys en código cliente
- ❌ NUNCA confiar en validación solo del cliente

### Base de Datos
- ✅ Usar `ensureInitialized()` antes de queries
- ✅ Manejar diferencias web (localStorage) vs nativo (SQLite)
- ✅ Crear índices en columnas frecuentemente consultadas
- ✅ Registrar auditoría para operaciones críticas
- ❌ NUNCA hacer queries síncronas (usar async/await)

### Performance
- ✅ Lazy load todas las rutas/páginas
- ✅ Usar signals para estado reactivo simple
- ✅ Implementar virtual scrolling en listas grandes
- ✅ Optimizar imágenes (WebP, lazy loading)
- ❌ NUNCA cargar todo el dataset de una vez
- ❌ NUNCA usar (change) en inputs sin debounce

### Accesibilidad
- ✅ Incluir ARIA labels en todos los controles
- ✅ Mantener contraste mínimo 4.5:1
- ✅ Navegación por teclado funcionando
- ✅ Testar con screen readers
- ❌ NUNCA usar `div` para botones (usar `<button>`)

### Comunicación
- ✅ **Siempre responder en español**
- ✅ Explicar decisiones técnicas cuando sean complejas
- ✅ Sugerir mejoras cuando detectes code smells
- ✅ Código primero, explicaciones después (working code over explanations)
- ❌ NUNCA asumir requisitos ambiguos (preguntar primero)

## Comandos Frecuentes

```bash
# Desarrollo
npm start                           # Servidor dev (puerto 8100)
npm run build                       # Build producción
npm run watch                       # Build con watch mode
npm test                            # Ejecutar tests
npm run lint                        # Linting

# Capacitor (Nativo)
npx cap sync                        # Sincronizar web → nativo
npx cap run android                 # Ejecutar en Android
npx cap run ios                     # Ejecutar en iOS
npx cap open android                # Abrir Android Studio
npx cap open ios                    # Abrir Xcode

# Base de Datos (Dev)
# Las migraciones se manejan en database.service.ts
# Para reset: llamar a resetDatabase() desde el código
```

## Guías de Estilo y Referencias

- **Angular Style Guide**: https://angular.io/guide/styleguide
- **Ionic Components**: https://ionicframework.com/docs/components
- **Capacitor Plugins**: https://capacitorjs.com/docs/plugins
- **WCAG 2.1 AA**: https://www.w3.org/WAI/WCAG21/quickref/
- **Material Design (iOS adaptado)**: Seguir iOS Human Interface Guidelines

## Contexto de Testing

### Estrategia
- **Unit Tests**: Servicios y utilidades (70% coverage target)
- **Component Tests**: Lógica de componentes standalone
- **E2E**: Flujos críticos (login, crear gasto, dashboard)

### Herramientas
- Jasmine + Karma para unit/component tests
- Considerar Playwright/Cypress para E2E (futuro)

## Estado Actual del Proyecto

### ✅ Implementado
- **Autenticación completa**:
  - Login con email/password
  - Registro de usuarios con validación
  - Manejo de sesiones con AuthService
- **Dashboard funcional**:
  - Cards de resumen (ingresos, gastos, cuotas pendientes)
  - Gráfico circular de balance mensual (SVG donut chart)
  - Visualización de cuotas activas con progress bars
  - Historial de gastos recientes
  - Modales bottom-sheet para agregar income/expense
- **Gestión de gastos**:
  - CRUD completo de gastos con ExpenseService
  - Soporte para gastos con/sin cuotas
  - Categorías predefinidas con iconos e íconos de color
  - Cálculo automático de gastos mensuales
- **Base de datos dual-mode**:
  - SQLite para plataformas nativas
  - localStorage para web
  - Migraciones automáticas con versionado
- **Servicios core**:
  - AuthService (autenticación + sesiones)
  - DatabaseService (dual-mode SQLite/localStorage)
  - UserService (CRUD usuarios)
  - ExpenseService (CRUD gastos + cuotas)
  - CategoryService (gestión categorías)
  - AuditService (trazabilidad)

### 🚧 En Desarrollo
- **Interacciones iOS-native**:
  - Swipe-to-delete para cuotas pendientes
  - Feedback háptico en acciones críticas
- **Biometría**: Login rápido con Face ID/Touch ID
- **Visualización avanzada**: Gráficos detallados con Chart.js
- **Notificaciones**: Recordatorios de cuotas por vencer

### 📋 Roadmap
- Exportación de reportes (PDF/Excel)
- Categorías personalizadas con iconos/colores custom
- Presupuestos por categoría con alertas
- Recurrencia automática de gastos fijos
- Widget nativo (iOS/Android)
- Sincronización en la nube opcional (Firebase/Supabase)

---

## Principio Guía

> **"Código funcional sobre explicaciones exhaustivas"**
> Prioriza entregar código que funcione, bien tipado, accesible y performante.
> Las explicaciones son secundarias. El código debe hablar por sí mismo.

**Focus**: Modern Angular (signals, standalone), Ionic 8, TypeScript strict, iOS design, accesibilidad, performance.
