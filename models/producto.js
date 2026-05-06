'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Producto extends Model {
    static associate(models) {
      Producto.belongsTo(models.Categoria, {
        foreignKey: 'categoriaId',
        as: 'categoria'
      });
      Producto.hasMany(models.DetalleVenta, {
        foreignKey: 'productoId',
        as: 'detallesVenta'
      });
      Producto.hasMany(models.DetalleCompra, {
        foreignKey: 'productoId',
        as: 'detallesCompra'
      });
    }
  }

  Producto.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(160), allowNull: false },
      categoriaId: { type: DataTypes.INTEGER, allowNull: false },
      precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      costo: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      seguimientoInventario: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    },
    {
      sequelize,
      modelName: 'Producto',
      tableName: 'productos'
    }
  );

  return Producto;
};
