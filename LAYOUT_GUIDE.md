# Guía de Layout Consistente - AppGastos

## Variables CSS Globales (global.scss)

Todas las páginas deben usar estas variables para garantizar consistencia en padding y spacing:

```scss
:root {
  --app-safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --app-tab-bar-height: 49px;
  --app-content-padding: 16px;
  --app-bottom-spacing: 80px; /* Tab bar + margin adicional */
  --app-total-bottom-spacing: calc(var(--app-safe-area-bottom) + var(--app-bottom-spacing));
}
```

## Estructura Recomendada para Páginas

### HTML Template
```html
<ion-header [translucent]="true" class="ion-no-border">
  <ion-toolbar class="header-toolbar">
    <ion-title class="header-title">Título</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true">
  <div class="page-content">
    <!-- Contenido de la página -->
  </div>
</ion-content>
```

### SCSS Styles
```scss
ion-content {
  --background: #e7ecf1;
}

.page-content {
  padding: var(--app-content-padding);
  padding-bottom: var(--app-total-bottom-spacing);
  min-height: 100%;
}
```

## Casos de Uso

### 1. Páginas con Tab Bar (Dashboard, Statistics, Profile)
✅ **USAR**: `padding-bottom: var(--app-total-bottom-spacing);`

Esto garantiza espacio suficiente para:
- Tab bar (49px)
- Safe area (notch en iPhone X+)
- Margen adicional (31px)

### 2. Páginas sin Tab Bar (Login, Register, Modals)
✅ **USAR**: `min-height: 100%;` + `padding: 24px;` (custom según diseño)

No necesitan espacio extra para tab bar.

### 3. Páginas con FAB (Floating Action Button)
✅ El FAB ya tiene ajuste automático en global.scss:
```scss
ion-fab {
  &[vertical="bottom"] {
    margin-bottom: calc(var(--app-total-bottom-spacing) + 16px);
  }
}
```

## Reglas de Oro

### ✅ HACER
- Usar variables CSS globales para padding/spacing
- Mantener `padding: var(--app-content-padding)` (16px) en todos los lados
- Usar `padding-bottom: var(--app-total-bottom-spacing)` en páginas con tab bar
- Testar en dispositivos reales con notch (iPhone X+)

### ❌ NO HACER
- Hardcodear valores como `padding: 16px` sin usar variables
- Usar `padding-bottom: 16px` en páginas con tab bar (insuficiente)
- Olvidar `min-height: 100%` (causa problemas en pantallas cortas)
- Ignorar safe-area para dispositivos con notch

## Ejemplo Completo: Nueva Página

### 1. Create page-name.page.html
```html
<ion-header [translucent]="true" class="ion-no-border">
  <ion-toolbar class="header-toolbar">
    <ion-title class="header-title">Nueva Página</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true">
  <div class="page-content">
    <!-- Tu contenido aquí -->
    <div class="ios-card">
      <h2>Card de ejemplo</h2>
    </div>
  </div>
</ion-content>
```

### 2. Create page-name.page.scss
```scss
ion-header {
  &.ion-no-border {
    ion-toolbar {
      --border-width: 0;
    }
  }
}

.header-toolbar {
  --background: rgba(246, 247, 248, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  --padding-top: 8px;

  .header-title {
    font-size: 30px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: #1C1C1E;
  }
}

ion-content {
  --background: #e7ecf1;
}

.page-content {
  padding: var(--app-content-padding);
  padding-bottom: var(--app-total-bottom-spacing);
  min-height: 100%;
}

// Dark Mode
:host-context(body.dark),
:host-context(body.ion-palette-dark) {
  .header-toolbar {
    --background: rgba(52, 52, 65, 0.8);

    .header-title {
      color: #FFFFFF;
    }
  }

  ion-content {
    --background: #000000;
  }

  .page-content {
    background: #202530;
  }

  .ios-card {
    background: #1C1C1E;
  }
}
```

## Testing Checklist

Antes de considerar una página como "lista", verifica:

- [ ] Layout consistente en iPhone SE (375px)
- [ ] Layout consistente en iPhone 14 Pro (notch)
- [ ] Layout consistente en iPad (768px+)
- [ ] Scroll funciona correctamente
- [ ] Tab bar no solapa contenido
- [ ] FAB (si existe) no solapa tab bar
- [ ] Dark mode funciona correctamente
- [ ] Padding lateral consistente (16px)
- [ ] Padding inferior correcto con safe-area

## Responsive Breakpoints

```scss
// Mobile-first (default)
.page-content {
  padding: var(--app-content-padding);
}

// Tablet (768px+)
@media (min-width: 768px) {
  .page-content {
    padding: 24px;
    padding-bottom: var(--app-total-bottom-spacing);
  }
}

// Desktop (1024px+)
@media (min-width: 1024px) {
  .page-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px;
    padding-bottom: var(--app-total-bottom-spacing);
  }
}
```

---

**Última actualización**: 2025-11-16
**Mantenedor**: Claude Code
**Stack**: Ionic 8 + Angular 20 + Tailwind CSS
