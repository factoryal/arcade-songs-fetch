import { DataTypes } from 'sequelize';
import sequelize from './sequelize';

const Song = sequelize.define('Song', {
  category: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    primaryKey: true,
  },

  artist: DataTypes.STRING,

  imageName: DataTypes.STRING,
  imageUrl: DataTypes.STRING,

  version: DataTypes.STRING,
  releaseDate: DataTypes.DATEONLY,

  isNew: DataTypes.BOOLEAN,
  isLocked: DataTypes.BOOLEAN,
});

export default Song;
