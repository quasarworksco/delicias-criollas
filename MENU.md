# Cargar la carta

En Firestore del proyecto `delicias-9c0b0`, crea un documento por plato en `menuPublico`. Puedes usar un ID automático. Cada documento de esa colección es público. Mantén los borradores y datos privados en otras colecciones.

| Campo | Tipo | Uso |
| --- | --- | --- |
| `nombre` | Texto | Nombre del plato |
| `categoria` | Texto | Etiqueta tal como debe aparecer en el filtro |
| `precioCentavos` | Entero | Precio en centavos de dólar |
| `descripcion` | Texto | Descripción o ingredientes, opcional |
| `fotoPublicId` | Texto | ID público de la imagen en Cloudinary, opcional |
| `orden` | Entero | Posición en la carta, opcional |
| `promocion` | Texto | Texto de la promoción, opcional |

En Cloudinary usa la nube `do4fpfwlb` y copia el identificador público completo, incluida su carpeta si aplica. Cárgala como imagen pública con entrega `upload`. El sitio pide un recorte de 720 × 540 con formato y calidad automáticos.

Publica el bloque de `firestore.rules` en **Firestore Database → Reglas**. Si el proyecto ya contiene reglas para otras colecciones, incorpora el bloque `match /menuPublico/{platoId}` en las reglas existentes. Confirma que ninguna regla más amplia conceda escritura a esa ruta. Carga o edita platos desde la consola de Firebase con permisos del proyecto. La web tiene acceso de lectura a la carta.

`data/menu-inicial.json` contiene los 16 productos suministrados y sirve como respaldo cuando Firestore no responde. También sirve de fuente para la carga inicial. Conserva los IDs si vas a actualizar los mismos productos. Después de modificar precios o disponibilidad, actualiza la copia de respaldo para evitar diferencias durante una caída.

## Pedidos y administración

Activa Authentication con correo y contraseña. Crea la cuenta del encargado y, desde la consola de Firestore, crea un documento en `administradores/{UID}` con el UID de esa cuenta. Solo el personal autorizado debe tener ese documento. Con la CLI de Firebase autenticada en el proyecto y la facturación de Functions habilitada, instala las dependencias desde `functions` con `npm install`. Desde la raíz ejecuta `firebase deploy --project delicias-9c0b0 --only firestore:rules,functions`. Revisa cualquier regla que ya exista en ese proyecto antes de reemplazarla.

Entra a `/admin/` y pulsa **Cargar los productos iniciales que falten**. El carrito valida precios contra los documentos reales de Firestore. Los pedidos se registran antes de abrir WhatsApp. La limpieza programada revisa cada cinco minutos los recibos que han cumplido 48 horas. El historial enviado por WhatsApp permanece en el chat.
