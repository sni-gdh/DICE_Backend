import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../db/postgres.js';
import {User} from './centeralized.models.js';

const Server = sequelize.define('Server', {
  server_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  admin: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  avatar: {
    type: DataTypes.JSON, // Store as a stringified JSON
    allowNull: false,
    defaultValue: {
      url: "https://res.cloudinary.com/ddyuwxg3o/image/upload/v1741023486/car_dscuzg.jpg",
      localPath: ""
    }
  }
});
export default Server;