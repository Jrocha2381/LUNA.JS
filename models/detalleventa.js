'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DetalleVenta extends Model {
    static associate(models) {
      DetalleVenta.belongsTo(models.Venta, { foreignKey: { name: 'ventaId', field: 'ventaId' }, as: 'venta' });
      DetalleVenta.belongsTo(models.Producto, { foreignKey: { name: 'productoId', field: 'productoId' }, as: 'producto' });
    }
  }

  DetalleVenta.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ventaId: { type: DataTypes.INTEGER, allowNull: false, field: 'ventaId' },
      productoId: { type: DataTypes.INTEGER, allowNull: false, field: 'productoId' },
      cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      precioUnitario: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'precioUnitario' },
      subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 }
    },
    {
      sequelize,
      modelName: 'DetalleVenta',
      tableName: 'detalle_ventas',
      timestamps: true,
      underscored: true
    }
  );

  return DetalleVenta;
};

