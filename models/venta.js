'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Venta extends Model {
    static associate(models) {
      Venta.belongsTo(models.Cliente, {
        foreignKey: { name: 'clienteId', field: 'clienteId' },
        as: 'cliente'
      });
      Venta.belongsTo(models.Usuario, {
        foreignKey: { name: 'usuarioId', field: 'usuarioId' },
        as: 'usuario'
      });
      Venta.belongsTo(models.Descuento, {
        foreignKey: { name: 'descuentoId', field: 'descuentoId' },
        as: 'descuento'
      });
      Venta.hasMany(models.DetalleVenta, {
        foreignKey: { name: 'ventaId', field: 'ventaId' },
        as: 'detalles'
      });
    }
  }

  Venta.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      clienteId: { type: DataTypes.INTEGER, allowNull: true, field: 'clienteId' },
      usuarioId: { type: DataTypes.INTEGER, allowNull: true, field: 'usuarioId' },
      metodoPago: { type: DataTypes.STRING(50), allowNull: true, field: 'metodoPago' },
      subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      descuentoId: { type: DataTypes.INTEGER, allowNull: true, field: 'descuentoId' },
      descuentoAplicado: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'descuentoAplicado' },
      total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      totalReembolsado: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'totalReembolsado' },
      reembolsos: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      items: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      estado: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'activa' }
    },
    {
      sequelize,
      modelName: 'Venta',
      tableName: 'ventas',
      timestamps: true,
      underscored: true
    }
  );

  return Venta;
};
