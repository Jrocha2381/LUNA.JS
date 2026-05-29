'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Faltante extends Model {
    static associate(models) {
      Faltante.belongsTo(models.Cliente, {
        foreignKey: { name: 'clienteId', field: 'clienteId' },
        as: 'cliente'
      });

      Faltante.belongsTo(models.Proveedor, {
        foreignKey: { name: 'proveedorId', field: 'proveedorId' },
        as: 'proveedor'
      });

      Faltante.belongsTo(models.Producto, {
        foreignKey: { name: 'productoId', field: 'productoId' },
        as: 'producto'
      });
    }
  }

  Faltante.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      // Demanda siempre ligada a un cliente.
      clienteId: { type: DataTypes.INTEGER, allowNull: false, field: 'clienteId' },

      // Puede ser nulo si no se conoce proveedor.
      proveedorId: { type: DataTypes.INTEGER, allowNull: true, field: 'proveedorId' },

      // Puede ser null si el producto no existe en inventario.
      productoId: { type: DataTypes.INTEGER, allowNull: true, field: 'productoId' },

      // Registro del producto cuando no existe en inventario.
      productoNombre: { type: DataTypes.STRING(160), allowNull: true, field: 'productoNombre' },
      productoCodigo: { type: DataTypes.STRING(80), allowNull: true, field: 'productoCodigo' },

      // Tipo (texto libre, como se trabaja en el código).
      tipo: { type: DataTypes.STRING(80), allowNull: false, field: 'tipo' },

      cantidadSolicitada: { type: DataTypes.INTEGER, allowNull: false, field: 'cantidadSolicitada', defaultValue: 1 },
      cantidadResuelta: { type: DataTypes.INTEGER, allowNull: false, field: 'cantidadResuelta', defaultValue: 0 },
      resuelto: { type: DataTypes.BOOLEAN, allowNull: false, field: 'resuelto', defaultValue: false },

      fechaSolicitado: { type: DataTypes.DATE, allowNull: false, field: 'fechaSolicitado' },
      fechaResuelto: { type: DataTypes.DATE, allowNull: true, field: 'fechaResuelto' },

      comentarios: { type: DataTypes.TEXT, allowNull: true, field: 'comentarios' }
    },
    {
      sequelize,
      modelName: 'Faltante',
      tableName: 'faltantes',
      timestamps: true,
      underscored: true
    }
  );

  return Faltante;
};

