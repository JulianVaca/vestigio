# Guía de movimiento — VESTIGIO

> Regla de oro: **cada movimiento responde a una pregunta del usuario** (¿dónde estoy?, ¿qué cambió?, ¿funcionó mi acción?, ¿qué talla elijo?).

## 1. Tokens cinéticos

| Token | Curva | Duración | Uso |
|---|---|---|---|
| **Zoom Marquilla** | `cubic-bezier(0.22, 1, 0.36, 1)` | 0.65 – 1.05 s | Zoom-out desde la marquilla tejida del cuello/lengüeta para elegir la talla |
| **Telón Helénico** | `cubic-bezier(0.76, 0, 0.24, 1)` | 0.45 – 0.55 s | Transiciones de página y menús |
| **Carrera Carrito** | `cubic-bezier(0.22, 0.88, 0.38, 1)` | 0.78 s | Carrito corriendo dinámicamente frente a la pantalla al hacer clic en el carrito |
| **Sello Archivo** | `spring(600, 14)` | ~0.54 s | Vuelo en cápsula 3D con estela botánica y caballito ("wheelie") del carrito |

## 2. Botón de Movimiento (Onda / Línea Horizontal al lado del Carrito)

- El botón situado a la izquierda del carrito en el encabezado controla el estado global de las animaciones:
  - **Onda (`MotionIcon`)**: Animaciones activas (por defecto en PC y móvil).
  - **Línea horizontal (`StillIcon`)**: Modo estático / movimiento reducido para accesibilidad.
