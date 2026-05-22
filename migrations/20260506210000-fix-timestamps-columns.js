'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Función para verificar si una columna existe
      const columnExists = async (tableName, columnName) => {
        try {
          const tableDescription = await queryInterface.describeTable(tableName, { transaction });
          return !!tableDescription[columnName];
        } catch (error) {
          return false;
        }
      };

      // Función para renombrar columna si existe
      const renameIfExists = async (tableName, oldName, newName) => {
        const hasOldColumn = await columnExists(tableName, oldName);
        const hasNewColumn = await columnExists(tableName, newName);
        
        if (hasOldColumn && !hasNewColumn) {
          console.log(`Renombrando ${tableName}.${oldName} -> ${newName}`);
          await queryInterface.renameColumn(tableName, oldName, newName, { transaction });
        } else if (hasNewColumn) {
          console.log(`${tableName}.${newName} ya existe, skipping`);
        } else {
          console.log(`${tableName}: sin columnas de timestamp, skipping`);
        }
      };

      // Función para agregar columna si no existe
      const addIfNotExists = async (tableName, columnName, columnDef) => {
        const hasColumn = await columnExists(tableName, columnName);
        if (!hasColumn) {
          console.log(`Agregando ${tableName}.${columnName}`);
          await queryInterface.addColumn(tableName, columnName, columnDef, { transaction });
        } else {
          console.log(`${tableName}.${columnName} ya existe`);
        }
      };

      // Listar todas las tablas del sistema
      const tables = [
        'usuarios',
        'categorias',
        'productos',
        'clientes',
        'proveedores',
        'ventas',
        'compras',
        'detalle_ventas',
        'detalle_compras'
      ];

      // Paso 1: Renombrar columnas oldStyle a newStyle
      for (const table of tables) {
        const tableExists = await queryInterface.tableExists(table, { transaction });
        if (tableExists) {
          await renameIfExists(table, 'createdAt', 'created_at');
          await renameIfExists(table, 'updatedAt', 'updated_at');
          
          // Paso 2: Si no existen timestamps, agregarlos
          await addIfNotExists(table, 'created_at', {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          });
          await addIfNotExists(table, 'updated_at', {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          });
        }
      }

      await transaction.commit();
      console.log('✓ Migración de timestamps completada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Error en migración de timestamps:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Rollback: renombrar de snake_case a camelCase
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      const columnExists = async (tableName, columnName) => {
        try {
          const tableDescription = await queryInterface.describeTable(tableName, { transaction });
          return !!tableDescription[columnName];
        } catch (error) {
          return false;
        }
      };

      const renameIfExists = async (tableName, oldName, newName) => {
        const hasOldColumn = await columnExists(tableName, oldName);
        if (hasOldColumn) {
          console.log(`Rollback: ${tableName}.${oldName} -> ${newName}`);
          await queryInterface.renameColumn(tableName, oldName, newName, { transaction });
        }
      };

      const tables = [
        'usuarios',
        'categorias',
        'productos',
        'clientes',
        'proveedores',
        'ventas',
        'compras',
        'detalle_ventas',
        'detalle_compras'
      ];

      for (const table of tables) {
        const tableExists = await queryInterface.tableExists(table, { transaction });
        if (tableExists) {
          await renameIfExists(table, 'created_at', 'createdAt');
          await renameIfExists(table, 'updated_at', 'updatedAt');
        }
      }

      await transaction.commit();
      console.log('✓ Rollback de timestamps completado');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Error en rollback:', error);
      throw error;
    }
  }
};

