import { DataTypes } from 'sequelize';
import {sequelize} from '../db/postgres.js';


const Channel = sequelize.define('Channel', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  serverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  avatar: {
    type: DataTypes.JSON, // Store as a stringified JSON
    allowNull: false,
    defaultValue: {
      url: "https://res.cloudinary.com/ddyuwxg3o/image/upload/v1741023486/mountain_srdptn.jpg",
      localPath: ""
    }
  },
  lastThread : {
    type : DataTypes.INTEGER,
    defaultValue : undefined
  }
});

export default Channel;