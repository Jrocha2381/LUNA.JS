'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RequestLog extends Model {}

  RequestLog.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      method: { type: DataTypes.STRING(10), allowNull: false },
      path: { type: DataTypes.STRING(500), allowNull: false },
      ip: { type: DataTypes.STRING(80), allowNull: true }
    },
    {
      sequelize,
      modelName: 'RequestLog',
      tableName: 'request_log'
    }
  );

  return RequestLog;
};
