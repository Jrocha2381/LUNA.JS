'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.renameTable('request_logs', 'request_log');
  },

  async down(queryInterface) {
    await queryInterface.renameTable('request_log', 'request_logs');
  }
};
