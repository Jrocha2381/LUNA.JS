'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    static associate(models) {
      Usuario.hasMany(models.Venta, { foreignKey: 'usuarioId', as: 'ventas' });
      Usuario.hasMany(models.Compra, { foreignKey: 'usuarioId', as: 'compras' });
    }
  }

  Usuario.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(160), allowNull: false },
      correo: { type: DataTypes.STRING(160), allowNull: true, unique: true, validate: { isEmail: true } },
      rol: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'cajero' }
    },
    {
      sequelize,
      modelName: 'Usuario',
      tableName: 'usuarios'
    }
  );

  return Usuario;
};

