'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DetalleCompra extends Model {
    static associate(models) {
      DetalleCompra.belongsTo(models.Compra, { foreignKey: { name: 'compraId', field: 'compraId' }, as: 'compra' });
      DetalleCompra.belongsTo(models.Producto, { foreignKey: { name: 'productoId', field: 'productoId' }, as: 'producto' });
    }
  }

  DetalleCompra.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      compraId: { type: DataTypes.INTEGER, allowNull: false, field: 'compraId' },
      productoId: { type: DataTypes.INTEGER, allowNull: false, field: 'productoId' },
      cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      costoUnitario: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'costoUnitario' },
      subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 }
    },
    {
      sequelize,
      modelName: 'DetalleCompra',
      tableName: 'detalle_compras',
      timestamps: true,
      underscored: true
    }
  );

  return DetalleCompra;
};

