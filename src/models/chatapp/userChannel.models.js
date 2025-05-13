import { sequelize } from '../../db/postgres.js';
import { DataTypes } from 'sequelize';

const ChannelUser = sequelize.define('ChannelUser', {
    channelId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  });
  export default ChannelUser;