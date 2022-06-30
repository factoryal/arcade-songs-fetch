import { Sequelize } from 'sequelize';

export default new Sequelize('sqlite:data/diva/db.sqlite3', {
  logging: false,
  define: {
    timestamps: false,
  },
});