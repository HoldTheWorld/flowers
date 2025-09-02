const {Sequelize} = require('sequelize');
const { logInfo, logError } = require('../utils/logger');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT
  }); 

  async function  testBD() {
    try {
      await sequelize.authenticate();
      logInfo('Connection has been established successfully.', {
        operation: 'database_connection',
        context: 'sequelize_authenticate'
      });
    } catch (error) {
      logError(error, {
        operation: 'database_connection',
        context: 'sequelize_authenticate_error'
      });
    }
  
  }
  testBD()

  async function closeConnection() {
    try {
      await sequelize.close();
      logInfo('connection closed', {
        operation: 'database_connection',
        context: 'sequelize_close'
      });
    } catch (err) {
      logError(err, {
        operation: 'database_connection',
        context: 'sequelize_close_error'
      });
    }
  }

  module.exports = sequelize;
