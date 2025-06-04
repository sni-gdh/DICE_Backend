import { DataTypes } from 'sequelize';
import {sequelize} from '../../db/postgres.js';


const Channel = sequelize.define('Channel', {
  id : {
    type : DataTypes.UUID,
    defaultValue : DataTypes.UUIDV4,
    primaryKey : true,
    allowNull:false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  serverId: {
    type: DataTypes.UUID,
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
  admin: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  lastThread : {
    type : DataTypes.UUID,
    defaultValue : undefined
  }
});

export default Channel;