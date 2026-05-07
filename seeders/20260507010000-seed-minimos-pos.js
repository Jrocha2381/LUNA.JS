'use strict';

const { faker } = require('@faker-js/faker');

async function scalar(queryInterface, sql) {
  const [rows] = await queryInterface.sequelize.query(sql);
  return rows?.[0] || {};
}

async function count(queryInterface, table) {
  const r = await scalar(queryInterface, `SELECT COUNT(*) as c FROM ${table};`);
  return Number(r.c || 0);
}

async function maxId(queryInterface, table) {
  const r = await scalar(queryInterface, `SELECT COALESCE(MAX(id),0) as m FROM ${table};`);
  return Number(r.m || 0);
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    faker.seed(20260507);
    const now = new Date();

    // 1) Usuarios (mínimo 2, por correo único)
    const [usuariosExist] = await queryInterface.sequelize.query(
      "SELECT correo FROM usuarios WHERE correo IN ('admin@pos.local','cajero1@pos.local');"
    );
    const existentes = new Set(usuariosExist.map(u => u.correo));
    const usuarios = [];
    if (!existentes.has('admin@pos.local')) {
      usuarios.push({ nombre: 'Admin', correo: 'admin@pos.local', rol: 'admin', createdAt: now, updatedAt: now });
    }
    if (!existentes.has('cajero1@pos.local')) {
      usuarios.push({ nombre: 'Cajero 1', correo: 'cajero1@pos.local', rol: 'cajero', createdAt: now, updatedAt: now });
    }
    if (usuarios.length) await queryInterface.bulkInsert('usuarios', usuarios);

    // 2) Categorías (mínimo 6, por nombre único)
    const categoriasObjetivo = [
      'Cuadernos',
      'Lápices y Marcadores',
      'Papelería',
      'Arte',
      'Oficina',
      'Accesorios'
    ];
    const [catRows] = await queryInterface.sequelize.query('SELECT nombre FROM categorias;');
    const catSet = new Set(catRows.map(c => c.nombre));
    const cats = categoriasObjetivo
      .filter(n => !catSet.has(n))
      .map(nombre => ({ nombre, createdAt: now, updatedAt: now }));
    if (cats.length) await queryInterface.bulkInsert('categorias', cats);

    // 3) Proveedores (mínimo 5)
    const proveedoresMin = 5;
    const proveedoresActual = await count(queryInterface, 'proveedores');
    const proveedoresFaltan = Math.max(0, proveedoresMin - proveedoresActual);
    if (proveedoresFaltan > 0) {
      const proveedores = [];
      for (let i = 0; i < proveedoresFaltan; i++) {
        proveedores.push({
          nombre: `${faker.company.name()} S.A.S`,
          telefono: faker.phone.number('60########'),
          correo: faker.internet.email({ provider: 'proveedor.co' }).toLowerCase(),
          createdAt: now,
          updatedAt: now
        });
      }
      await queryInterface.bulkInsert('proveedores', proveedores);
    }

    // 4) Clientes (mínimo 20)
    const clientesMin = 20;
    const clientesActual = await count(queryInterface, 'clientes');
    const clientesFaltan = Math.max(0, clientesMin - clientesActual);
    if (clientesFaltan > 0) {
      const clientes = [];
      for (let i = 0; i < clientesFaltan; i++) {
        const nombre = faker.person.fullName();
        clientes.push({
          nombre,
          telefono: faker.phone.number('3#########'),
          correo: faker.internet
            .email({ firstName: nombre.split(' ')[0], lastName: nombre.split(' ').slice(1).join(' ') })
            .toLowerCase(),
          createdAt: now,
          updatedAt: now
        });
      }
      await queryInterface.bulkInsert('clientes', clientes);
    }

    // 5) Productos (mínimo 30)
    const productosMin = 30;
    const productosActual = await count(queryInterface, 'productos');
    const productosFaltan = Math.max(0, productosMin - productosActual);
    if (productosFaltan > 0) {
      const [catIdsRows] = await queryInterface.sequelize.query('SELECT id FROM categorias ORDER BY id;');
      const categoriaIds = catIdsRows.map(r => r.id);
      if (!categoriaIds.length) throw new Error('No hay categorías para asociar productos.');

      const productos = [];
      for (let i = 0; i < productosFaltan; i++) {
        const costo = faker.number.int({ min: 500, max: 30000 });
        const margen = faker.number.int({ min: 200, max: 15000 });
        productos.push({
          nombre: faker.commerce.productName(),
          categoriaId: faker.helpers.arrayElement(categoriaIds),
          precio: costo + margen,
          costo,
          stock: faker.number.int({ min: 0, max: 80 }),
          seguimientoInventario: true,
          createdAt: now,
          updatedAt: now
        });
      }
      await queryInterface.bulkInsert('productos', productos);
    }

    // 6) Ventas + DetalleVenta (mínimo 10 ventas)
    const ventasMin = 10;
    const ventasActual = await count(queryInterface, 'ventas');
    const ventasFaltan = Math.max(0, ventasMin - ventasActual);
    if (ventasFaltan > 0) {
      const productoMax = await maxId(queryInterface, 'productos');
      const clienteMax = await maxId(queryInterface, 'clientes');
      const usuarioMax = await maxId(queryInterface, 'usuarios');
      const usuarioId = usuarioMax >= 2 ? 2 : usuarioMax || null;

      let ventaId = (await maxId(queryInterface, 'ventas')) + 1;
      let detalleId = (await maxId(queryInterface, 'detalle_ventas')) + 1;

      const ventas = [];
      const detalles = [];
      for (let i = 0; i < ventasFaltan; i++) {
        const lineas = faker.number.int({ min: 1, max: 4 });
        const fecha = faker.date.recent({ days: 15 });
        const clienteId = clienteMax ? faker.number.int({ min: 1, max: clienteMax }) : null;

        let total = 0;
        const usados = new Set();
        for (let j = 0; j < lineas; j++) {
          let productoId = faker.number.int({ min: 1, max: productoMax });
          while (usados.has(productoId)) productoId = faker.number.int({ min: 1, max: productoMax });
          usados.add(productoId);

          const cantidad = faker.number.int({ min: 1, max: 3 });
          const precioUnitario = faker.number.int({ min: 800, max: 35000 });
          const subtotal = Number((cantidad * precioUnitario).toFixed(2));
          total += subtotal;

          detalles.push({
            id: detalleId++,
            ventaId,
            productoId,
            cantidad,
            precioUnitario,
            subtotal,
            createdAt: now,
            updatedAt: now
          });
        }

        ventas.push({
          id: ventaId,
          fecha,
          clienteId,
          usuarioId,
          metodoPago: faker.helpers.arrayElement(['efectivo', 'tarjeta', 'transferencia']),
          total: Number(total.toFixed(2)),
          items: '[]',
          createdAt: now,
          updatedAt: now
        });

        ventaId++;
      }

      await queryInterface.bulkInsert('ventas', ventas);
      await queryInterface.bulkInsert('detalle_ventas', detalles);
    }

    // 7) Compras + DetalleCompra (mínimo 5 compras)
    const comprasMin = 5;
    const comprasActual = await count(queryInterface, 'compras');
    const comprasFaltan = Math.max(0, comprasMin - comprasActual);
    if (comprasFaltan > 0) {
      const productoMax = await maxId(queryInterface, 'productos');
      const proveedorMax = await maxId(queryInterface, 'proveedores');
      const usuarioMax = await maxId(queryInterface, 'usuarios');
      const usuarioId = usuarioMax >= 1 ? 1 : usuarioMax || null;

      let compraId = (await maxId(queryInterface, 'compras')) + 1;
      let detalleId = (await maxId(queryInterface, 'detalle_compras')) + 1;

      const compras = [];
      const detalles = [];
      for (let i = 0; i < comprasFaltan; i++) {
        const lineas = faker.number.int({ min: 1, max: 5 });
        const fecha = faker.date.recent({ days: 30 });
        const proveedorId = proveedorMax ? faker.number.int({ min: 1, max: proveedorMax }) : null;

        let total = 0;
        const usados = new Set();
        for (let j = 0; j < lineas; j++) {
          let productoId = faker.number.int({ min: 1, max: productoMax });
          while (usados.has(productoId)) productoId = faker.number.int({ min: 1, max: productoMax });
          usados.add(productoId);

          const cantidad = faker.number.int({ min: 1, max: 10 });
          const costoUnitario = faker.number.int({ min: 400, max: 25000 });
          const subtotal = Number((cantidad * costoUnitario).toFixed(2));
          total += subtotal;

          detalles.push({
            id: detalleId++,
            compraId,
            productoId,
            cantidad,
            costoUnitario,
            subtotal,
            createdAt: now,
            updatedAt: now
          });
        }

        compras.push({
          id: compraId,
          fecha,
          proveedorId,
          usuarioId,
          total: Number(total.toFixed(2)),
          items: '[]',
          createdAt: now,
          updatedAt: now
        });

        compraId++;
      }

      await queryInterface.bulkInsert('compras', compras);
      await queryInterface.bulkInsert('detalle_compras', detalles);
    }
  },

  async down() {
    // Intencional: no hacemos "undo" automático para evitar borrar data real.
  }
};

