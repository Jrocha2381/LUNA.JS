'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Categoria extends Model {
    static associate(models) {
      Categoria.hasMany(models.Producto, {
        foreignKey: { name: 'categoriaId', field: 'categoriaId' },
        as: 'productos'
      });
    }
  }

  Categoria.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(120), allowNull: false, unique: true }
    },
    {
      sequelize,
      modelName: 'Categoria',
      tableName: 'categorias',
      timestamps: true,
      underscored: true
    }
  );

  return Categoria;
};

