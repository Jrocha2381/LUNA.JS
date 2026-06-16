'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Compra extends Model {
    static associate(models) {
      Compra.belongsTo(models.Proveedor, {
        foreignKey: { name: 'proveedorId', field: 'proveedorId' },
        as: 'proveedor'
      });
      Compra.belongsTo(models.Usuario, {
        foreignKey: { name: 'usuarioId', field: 'usuarioId' },
        as: 'usuario'
      });
      Compra.hasMany(models.DetalleCompra, {
        foreignKey: { name: 'compraId', field: 'compraId' },
        as: 'detalles'
      });
    }
  }

  Compra.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      proveedorId: { type: DataTypes.INTEGER, allowNull: true, field: 'proveedorId' },
      usuarioId: { type: DataTypes.INTEGER, allowNull: true, field: 'usuarioId' },
      total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      items: { type: DataTypes.JSON, allowNull: false, defaultValue: [] }
    },
    {
      sequelize,
      modelName: 'Compra',
      tableName: 'compras',
      timestamps: true,
      underscored: true
    }
  );

  return Compra;
};
