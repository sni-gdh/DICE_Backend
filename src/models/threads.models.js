import { Sequelize, DataTypes } from 'sequelize';
import {sequelize} from '../db/postgres.js';
import Channel from '../models/channel.models.js';
import User from '../models/user.models.js';

const Thread = sequelize.define('Thread', {
  channelId: {
    type: DataTypes.INTEGER,
    references: {
      model: Channel,
      key: 'id',
    },
    allowNull: false,
  },
  senderId : {
    type : DataTypes.INTEGER,
    references : {
      model : User,
      key : 'id'
    },
    allowNull : false,
  },
  parent_id : { // Self refrencing for nesting threads
    type : DataTypes.INTEGER,
    references : {
      model : Thread,
      key : 'id'
    }
  },
  is_edited : {
    type : DataTypes.BOOLEAN,
    defaultValue : false
  },
  is_deleted : {
    type : DataTypes.BOOLEAN,
    defaultValue : false,
  }
});

// A thread (message) belongs to a single channel
Thread.belongsTo(Channel, { foreignKey: "channelId", as: "ChannelThread" });

User.hasMany(Thread, { foreignKey: "senderId", as: "sentThreads" });
Thread.belongsTo(User, { foreignKey: "senderId", as: "sender" });

Thread.hasMany(Thread, { foreignKey: "parent_id", as: "subThreads" });
Thread.belongsTo(Thread, { foreignKey: "parent_id", as: "parentThread" });
export default Thread;