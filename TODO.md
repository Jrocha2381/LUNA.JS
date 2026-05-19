# TODO - Ventas e Historial (API + Papelera)

- [ ] Analizar endpoints y modelos existentes para `ventas` y `detalle_ventas`.
- [ ] Modificar `carritopage/historial.js` para que cargue ventas desde API (`Backend.get('ventas')`) en vez de localStorage.
- [ ] Construir `venta.articulos` para cada venta consultando `Backend.get('detalle_ventas')` y filtrando por `ventaId`.
- [ ] Implementar papelera con persistencia en API: usar/eliminar/crear registros o marcar estado (a definir según modelo).
- [ ] Actualizar `carritopage/historial.html` si falta algún contenedor/botón para papelera basado en API.
- [ ] Verificar visualización: tarjetas, modal de detalles, búsqueda/orden.
- [ ] Probar flujo completo: finalizar venta -> aparece en historial -> enviar a papelera -> aparece en papelera -> recuperar/eliminar.

