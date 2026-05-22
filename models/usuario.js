'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    static associate(models) {
      Usuario.hasMany(models.Venta, { foreignKey: { name: 'usuarioId', field: 'usuarioId' }, as: 'ventas' });
      Usuario.hasMany(models.Compra, { foreignKey: { name: 'usuarioId', field: 'usuarioId' }, as: 'compras' });
    }

    async verifyPassword(plain) {
      if (!this.password) return false;
      return bcrypt.compare(plain, this.password);
    }
  }

  Usuario.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(160), allowNull: false },
      correo: { type: DataTypes.STRING(160), allowNull: true, unique: true, validate: { isEmail: true } },
      // Campo legacy usado por el POS
      rol: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'cajero' },

      // Campos para autenticación/autorización (password almacenada como hash bcrypt)
      username: { type: DataTypes.STRING(160), allowNull: true, unique: true },
      password: { type: DataTypes.STRING(255), allowNull: true },
      role: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: 'USER',
        validate: { isIn: [['USER', 'ADMIN']] }
      }
    },
    {
      sequelize,
      modelName: 'Usuario',
      tableName: 'usuarios',
      timestamps: true,
      underscored: true,
      hooks: {
        async beforeCreate(usuario) {
          if (!usuario.password) return;
          if (typeof usuario.password === 'string' && usuario.password.startsWith('$2')) return;
          usuario.password = await bcrypt.hash(usuario.password, 10);
        },
        async beforeUpdate(usuario) {
          if (!usuario.changed('password')) return;
          if (!usuario.password) return;
          if (typeof usuario.password === 'string' && usuario.password.startsWith('$2')) return;
          usuario.password = await bcrypt.hash(usuario.password, 10);
        }
      }
    }
  );

  return Usuario;
};

