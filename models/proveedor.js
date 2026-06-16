'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Proveedor extends Model {
    static associate(models) {
      Proveedor.hasMany(models.Compra, {
        foreignKey: { name: 'proveedorId', field: 'proveedorId' },
        as: 'compras'
      });
    }
  }

  Proveedor.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(160), allowNull: false },
      telefono: { type: DataTypes.STRING(30), allowNull: true },
      correo: { type: DataTypes.STRING(160), allowNull: true, validate: { isEmail: true } }
    },
    {
      sequelize,
      modelName: 'Proveedor',
      tableName: 'proveedores',
      timestamps: true,
      underscored: true
    }
  );

  return Proveedor;
};

