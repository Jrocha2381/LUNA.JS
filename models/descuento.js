'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Descuento extends Model {
    static associate(models) {
      Descuento.hasMany(models.Venta, {
        foreignKey: { name: 'descuentoId', field: 'descuentoId' },
        as: 'ventas'
      });
    }
  }

  Descuento.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(160), allowNull: false },
      tipo: { type: DataTypes.STRING(20), allowNull: false }, // 'porcentaje' | 'fijo'
      valor: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    },
    {
      sequelize,
      modelName: 'Descuento',
      tableName: 'descuentos',
      timestamps: true,
      underscored: true
    }
  );

  return Descuento;
};

