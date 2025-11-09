# Guía de Uso - AppGastos

## 🎯 Descripción General
AppGastos es una aplicación de gestión de gastos mensuales con diseño iOS. Permite establecer un presupuesto mensual y rastrear automáticamente los gastos, mostrando el dinero disponible restante.

---

## 📱 Pantalla Principal (Dashboard)

### Elementos Principales

#### 1. **Header**
- **Título**: "Dashboard"
- **Botón "+" (Nuevo)**: Presiona aquí para establecer o actualizar tu presupuesto mensual
- **Avatar de usuario**: Foto de perfil (no interactivo en versión actual)

#### 2. **Tarjetas de Resumen** (arriba)
```
┌─────────────────────────────────────────┐
│  Ingresos del mes                  ↑    │  ← Tu presupuesto
│  € 2,500.00                             │
│  +5.2%                                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Gastos del mes                    ↓    │  ← Total gastado
│  € 450.50                               │
│  -1.8%                                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Cuotas pendientes                      │  ← Número de cuotas
│  4                                      │
└─────────────────────────────────────────┘
```

#### 3. **Gráfico de Balance** (centro)
- Donut chart mostrando:
  - **Disponible**: Dinero restante del presupuesto
  - **Gastado**: Dinero ya gastado
  - **Ingresos**: Tu presupuesto total

#### 4. **Cuotas Activas** (abajo)
- Listado de compras en cuotas
- Muestra:
  - Nombre de la compra
  - Monto mensual
  - Barra de progreso (X de Y cuotas)

---

## 💰 Configurar Presupuesto Mensual

### Paso 1: Abrir el Modal
1. Presiona el botón **"+"** en la esquina superior derecha del header
2. Se abrirá el modal "Presupuesto Mensual"

### Paso 2: Ingresar Dinero
1. Verás un input grande con el símbolo **€**
2. Ingresa el dinero disponible para el mes (ej: 2500)
3. El presupuesto actual se mostrará debajo

### Paso 3: Guardar
1. Presiona el botón **"Guardar Presupuesto"**
2. Verás un spinner indicando que se guarda
3. Una notificación confirmará: "Ingreso guardado correctamente"
4. El modal se cerrará automáticamente
5. El dashboard mostrará el nuevo presupuesto

### ✅ Validaciones
- El monto debe ser mayor a 0
- No se acepta dinero negativo
- Máximo permitido: 999,999

---

## 🛍️ Registrar un Gasto

### Paso 1: Abrir Modal de Gastos
1. Presiona el **botón FAB "+"** en la esquina inferior derecha
2. Se abrirá el modal "Registrar Gasto"

### Paso 2: Completar Información

#### Descripción
- Ingresa qué compraste (ej: "Café con amigos")
- Campo requerido

#### Categoría
- Selecciona de las categorías disponibles:
  - 🍽️ Comida
  - 🚗 Transporte
  - 🎮 Entretenimiento
  - 🛒 Compras
  - ❤️ Salud
  - 📚 Educación
  - 🔧 Servicios
  - 📌 Otros

#### Monto
- Ingresa el precio pagado (ej: 4.50)
- Campo requerido y debe ser > 0

### Paso 3: Opciones de Cuotas (Opcional)
1. Si es una compra en cuotas, presiona el toggle:
   ```
   ¿Es compra en cuotas?  [ON/OFF]
   ```

2. Si activas, se mostrarán dos campos:
   - **Número de cuotas**: Cuántas cuotas (mínimo 2, ej: 12)
   - **Fecha de primer pago**: Cuándo inicia (por defecto hoy)

### Paso 4: Guardar Gasto
1. Presiona **"Guardar Gasto"**
2. Verás un spinner durante el guardado
3. Confirmación: "Gasto guardado correctamente"
4. El modal se cerrará
5. ⚠️ **El dashboard se actualiza automáticamente**:
   - Gastos aumentan
   - Balance disminuye
   - Si es cuota, aparece en "Cuotas Activas"

### ✅ Validaciones
- Descripción: requerida
- Monto: debe ser > 0
- Cuotas: mínimo 2 (si se marca la opción)

---

## 🏷️ Gestionar Categorías

### Crear Nueva Categoría

#### Opción 1: Desde el Modal de Gastos
1. Presiona el icono **"+"** junto al campo de Categoría
2. Se mostrará un formulario para nueva categoría
3. Ingresa el nombre (ej: "Mascotas", "Cine", "Libros")
4. Presiona **"Crear Categoría"**
5. La nueva categoría se agregará automáticamente al listado
6. Será seleccionada por defecto

### Ver Tus Categorías
En el modal de gastos, verás una sección "Mis categorías" con badges:
```
┌─────┬──────────┬────────────┐
│ Comida ✕ │ Transporte ✕ │ Entretenimiento ✕ │
└─────┴──────────┴────────────┘
```

### Eliminar Categoría
1. Presiona la **"X"** en el badge de la categoría que deseas eliminar
2. Se mostrará confirmación: "Categoría eliminada"
3. ⚠️ **No puedes eliminar la categoría seleccionada actualmente**
   - Selecciona otra categoría primero
   - Luego podrás eliminarla

---

## 📊 Entender el Dashboard

### Ingresos del Mes
- Dinero que estableciste como presupuesto
- Se actualiza cuando presionas el botón "+" del header
- Ej: € 2,500.00

### Gastos del Mes
- Total gastado en el mes actual
- Se suma cada vez que registras un gasto
- Para compras en cuotas, solo cuenta el monto mensual
- Ej: € 450.50

### Balance Disponible (Gráfico Donut)
- **Dinero disponible** = Ingresos - Gastos
- El gráfico muestra el porcentaje gastado vs disponible
- Ejemplo: Si tienes €2,500 y gastaste €450:
  - Balance disponible: €2,050
  - Porcentaje gastado: 18%

### Cuotas Activas
- Compras pendientes de pagar (en cuotas)
- Muestra:
  - **Nombre**: Descripción de la compra
  - **Monto mensual**: Lo que pagas cada mes
  - **Progreso**: X de Y cuotas pagadas
  - Barra visual del progreso

---

## 🔄 Flujo de Dinero

```
┌─────────────────────────────────────────────────────┐
│ 1. Define tu presupuesto: € 2,500                  │
│    (Presiona "+" en header)                        │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│ 2. Registra un gasto: Café € 4.50                  │
│    (Presiona FAB "+" abajo)                        │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│ 3. Dashboard se actualiza automáticamente:         │
│    - Gastos: €4.50                                 │
│    - Balance: €2,495.50                            │
│    - Gráfico se ajusta                             │
└─────────────────────────────────────────────────────┘
```

---

## 💡 Consejos de Uso

### ✅ Para sacar el máximo partido:

1. **Establece un presupuesto realista**
   - Calcula tus ingresos mensuales
   - Reserva para gastos fijos
   - Establece ese monto como presupuesto

2. **Registra cada gasto al momento**
   - No esperes al final del mes
   - Esto te ayuda a monitorear tu dinero en tiempo real

3. **Usa las categorías efectivamente**
   - Agrupa gastos similares
   - Te ayuda a identificar dónde gastas más

4. **Revisa las cuotas activas**
   - Ten control de tus obligaciones mensuales
   - Prepárate con anticipación

5. **Consulta el balance regularmente**
   - Ve en el dashboard cuánto dinero te queda
   - Toma decisiones de gasto basadas en datos reales

---

## 🆘 Preguntas Frecuentes

### ¿Dónde se guardan mis datos?
Los datos se guardan en una base de datos:
- **Web**: localStorage del navegador
- **Mobile**: Base de datos SQLite local
- Todos tus datos permanecen en tu dispositivo

### ¿Puedo eliminar un gasto registrado?
No en la versión actual. Una futura mejora permitirá editar/eliminar gastos.

### ¿Qué pasa si excedo mi presupuesto?
El balance será negativo, indicando que gastaste más de lo planeado.
- Esto es útil para ver cuánto te excediste
- Ayuda a planificar mejor el próximo mes

### ¿Cómo editar mi presupuesto?
Presiona el botón "+" en el header nuevamente e ingresa el nuevo monto.
Reemplazará el anterior.

### ¿Las cuotas se cuentan en gastos?
Sí, pero solo el monto mensual:
- Compra en cuotas: €600 en 12 cuotas
- Gasto mensual: €50
- Balance desciende: €50 cada mes (no €600)

### ¿Puedo crear categorías personalizadas?
Sí, presiona el "+" junto a Categoría en el modal de gastos.

---

## 🎨 Diseño y Navegación

La app usa un **estilo iOS** consistente:
- Colores primarios: Azul/Teal (#22acd0)
- Cards redondeadas y sombras suaves
- Animaciones fluidas
- Botones con estados visuales claros

### Navegación Principal:
```
Dashboard (Pantalla actual)
    ↑
    ├── Botón "+" (Header) → Modal de Ingresos
    └── FAB "+" (Abajo derecha) → Modal de Gastos
            └── Gestión de Categorías
```

---

## 📱 Acceso Rápido

| Acción | Botón | Ubicación |
|--------|-------|-----------|
| Establecer presupuesto | **+** | Header (arriba derecha) |
| Agregar gasto | **FAB +** | Esquina inferior derecha |
| Crear categoría | **+** círculo | Dentro del modal de gastos |
| Eliminar categoría | **X** | Badge en "Mis categorías" |
| Cerrar modal | **←** o **✕** | Header del modal |

---

## 🚀 Próximas Características Planeadas

- ✨ Editar gastos existentes
- 📈 Reportes y estadísticas
- 📅 Filtros por fecha
- 💳 Presupuesto por categoría
- 🔔 Notificaciones de presupuesto
- 📊 Gráficos de tendencias
- 📥 Exportar datos (CSV, PDF)
- 🌍 Multi-moneda

---

**¡Disfruta controlando tus gastos! 💰**
