const sequelize = require('./connection');
const { User, Plant } = require('./models');
const { logInfo, logError } = require('../utils/logger');

async function createTables() {
  try {
    await sequelize.sync({ force: true });
    logInfo('TABLES WERE CREATED/CHECKED', {
      operation: 'create_tables',
      context: 'sequelize_sync'
    });
  } catch (err) {
    logError(err, {
      operation: 'create_tables',
      context: 'sequelize_sync_error'
    });
  }
}

createTables()
