# TODO - Módulo 3.6 Faltantes y demanda no atendida

- [ ] Implementar modelo Sequelize `Faltante` (relaciones con Cliente y Proveedor, y campos para producto no existente)
- [ ] Crear migration para tabla `faltantes`
- [ ] Crear validator `src/validators/faltante.validator.js`
- [ ] Crear controller `src/controllers/faltantes.controller.js` con:
  - [ ] registrar faltante (POST)
  - [ ] listar faltantes (GET)
  - [ ] filtrar por tipo y proveedor (query)
  - [ ] marcar como resuelto (PUT)
  - [ ] endpoint de insights para compras futuras (agrupados pendientes)
- [ ] Crear router `src/routes/faltantes.js`
- [ ] Montar router en `src/app.js`
- [ ] Verificar que `models/index.js` cargue el nuevo modelo automáticamente
- [ ] Ejecutar migraciones / sincronización y validar endpoints con requests de ejemplo

