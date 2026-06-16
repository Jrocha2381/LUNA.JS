'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('faltantes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      clienteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clientes',
          key: 'id'
        }
      },

      proveedorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'proveedores',
          key: 'id'
        }
      },

      productoId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'productos',
          key: 'id'
        }
      },

      productoNombre: {
        type: Sequelize.STRING(160),
        allowNull: true
      },

      productoCodigo: {
        type: Sequelize.STRING(80),
        allowNull: true
      },

      tipo: {
        type: Sequelize.STRING(80),
        allowNull: false
      },

      cantidadSolicitada: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },

      cantidadResuelta: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },

      resuelto: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },

      fechaSolicitado: {
        type: Sequelize.DATE,
        allowNull: false
      },

      fechaResuelto: {
        type: Sequelize.DATE,
        allowNull: true
      },

      comentarios: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('faltantes');
  }
};

