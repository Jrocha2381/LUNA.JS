'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Cliente extends Model {
    static associate(models) {
      Cliente.hasMany(models.Venta, {
        foreignKey: 'clienteId',
        as: 'ventas'
      });
    }
  }

  Cliente.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(160), allowNull: false },
      telefono: { type: DataTypes.STRING(30), allowNull: true },
      correo: { type: DataTypes.STRING(160), allowNull: true, validate: { isEmail: true } }
    },
    {
      sequelize,
      modelName: 'Cliente',
      tableName: 'clientes'
    }
  );

  return Cliente;
};

