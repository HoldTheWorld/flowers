const { DataTypes } = require('sequelize');
const sequelize = require('../connection');
const User = require('./User');

const Plant = sequelize.define('Plant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  plant_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  watering_frequency: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  last_watered: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  is_fine: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'plants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Plant.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Plant, { foreignKey: 'user_id' });

module.exports = Plant;
