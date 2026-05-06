'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Venta extends Model {
    static associate(models) {
      Venta.belongsTo(models.Cliente, {
        foreignKey: 'clienteId',
        as: 'cliente'
      });
    }
  }

  Venta.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      clienteId: { type: DataTypes.INTEGER, allowNull: true },
      metodoPago: { type: DataTypes.STRING(50), allowNull: true },
      total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      items: { type: DataTypes.JSON, allowNull: false, defaultValue: [] }
    },
    {
      sequelize,
      modelName: 'Venta',
      tableName: 'ventas'
    }
  );

  return Venta;
};

