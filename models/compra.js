'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Compra extends Model {
    static associate(models) {
      Compra.belongsTo(models.Proveedor, {
        foreignKey: 'proveedorId',
        as: 'proveedor'
      });
    }
  }

  Compra.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      proveedorId: { type: DataTypes.INTEGER, allowNull: true },
      total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      items: { type: DataTypes.JSON, allowNull: false, defaultValue: [] }
    },
    {
      sequelize,
      modelName: 'Compra',
      tableName: 'compras'
    }
  );

  return Compra;
};

