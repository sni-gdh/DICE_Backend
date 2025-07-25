import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../../db/postgres.js';
import {User} from './centeralized.models.js';

const Server = sequelize.define('Server', {
  id : {
    type : DataTypes.UUID,
    defaultValue : DataTypes.UUIDV4,
    primaryKey : true,
    allowNull:false,
  },
  server_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  admin: {
    type: DataTypes.UUID,
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