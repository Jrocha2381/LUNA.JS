# Plan: Historial de ventas 100% desde API + Papelera persistente

## Objetivo
- Que `carritopage/historial.html` muestre ventas desde la API (no localStorage).
- Que la papelera funcione de verdad con persistencia en API.

## Cambios propuestos (archivos)
1) Backend/DB
   - Migration: agregar columna en `ventas` (ej. `estado` o `enPapelera`).
   - `models/venta.js`: agregar el campo.
   - (Opcional) `src/validators/venta.validator.js`: permitir el campo.
   - Controladores: ajustar `list`/`remove`/`update` o filtrar por estado según requieras.

2) Frontend
   - `carritopage/historial.js`: cargar ventas con `Backend.get('ventas')`.
   - Obtener `detalle_ventas` y construir `venta.articulos` para el modal.
   - Papelera:
     - Enviar a papelera: `Backend.put('ventas/:id', { estado: 'papelera' })`.
     - Recuperar: `Backend.put('ventas/:id', { estado: 'activa' })`.
     - Eliminar permanentemente: `Backend.delete('ventas/:id')`.

## Verificación
- Finalizar una venta -> debe aparecer en historial.
- Enviar a papelera -> debe pasar al modo papelera.
- Recuperar -> debe volver al historial.
- Eliminar permanentemente -> desaparece.

