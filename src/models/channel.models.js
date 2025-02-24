import { Sequelize, DataTypes } from 'sequelize';
import {sequelize} from '../db/postgres.js';
import Thread from './threads.models.js';
const Channel = sequelize.define('Channel', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  serverId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Server',
      key: 'id',
    },
    allowNull: false,
  },
  avatar: {
    type: DataTypes.JSON, // Store as a stringified JSON
    allowNull: false,
    defaultValue: {
      url: "https://via.placeholder.com/200x200.png",
      localPath: ""
    }
  },
  participants: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false,
  },
  lastThread : {
    type : DataTypes.INTEGER,
    references : {
      model : Thread,
      key : 'id'
    }
  }
});

Server.hasMany(Channel , {foreignKey : 'serverId', as : 'ServerChannels'})
Channel.belongsTo(Server , {foreignKey  :"serverId", as : "ChannelServer"})

Channel.belongsToMany(User, { foreignKey : 'channelId', otherKey: 'userId', as: 'participants'});
User.belongsToMany(Channel, { foreignKey: 'userId', otherKey: 'channelId', as: 'channels'});

// A channel can have multiple threads (messages)
Channel.hasMany(Thread, { foreignKey: "channelId", as: "Threads" });
// To track the last message (thread) in a channel
Channel.belongsTo(Thread, { foreignKey: "lastThreadId", as: "LastThread" });


export default Channel;