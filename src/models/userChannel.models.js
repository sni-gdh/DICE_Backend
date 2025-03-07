import { sequelize } from '../db/postgres.js';
import { DataTypes } from 'sequelize';

const ChannelUser = sequelize.define('ChannelUser', {
    channelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });
  export default ChannelUser;