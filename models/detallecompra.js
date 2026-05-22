'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DetalleCompra extends Model {
    static associate(models) {
      DetalleCompra.belongsTo(models.Compra, { foreignKey: 'compraId', as: 'compra' });
      DetalleCompra.belongsTo(models.Producto, { foreignKey: 'productoId', as: 'producto' });
    }
  }

  DetalleCompra.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      compraId: { type: DataTypes.INTEGER, allowNull: false },
      productoId: { type: DataTypes.INTEGER, allowNull: false },
      cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      costoUnitario: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
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

