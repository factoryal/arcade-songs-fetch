import { DataTypes } from 'sequelize';
import sequelize from './sequelize';

const Sheet = sequelize.define('Sheet', {
  songId: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  type: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  difficulty: {
    type: DataTypes.STRING,
    primaryKey: true,
  },

  level: DataTypes.STRING,
});

export default Sheet;