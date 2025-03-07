import User from './user.models.js'
import Server from './server.models.js'
import Channel from './channel.models.js'
import Thread from './threads.models.js'
import ChannelUser from './userChannel.models.js'
import userServer from './userServer.models.js'

// Many to Many Relation
User.belongsToMany(Channel,{through : ChannelUser,foreignKey:"userId" ,otherKey : "channelId"})
Channel.belongsToMany(User, { through: ChannelUser , foreignKey:"channelId" ,otherKey : "userId"});

User.belongsToMany(Server,{through : userServer,foreignKey:"userId",otherKey:"serverId"});
Server.belongsToMany(User,{through : userServer,foreignKey:"serverId",otherKey:"userId"});

// One to Many relation.
User.hasMany(Server,{foreignKey : "admin"})
Server.belongsTo(User,{foreignKey : "admin"})

User.hasMany(Thread,{foreignKey : "senderId", as : "sender"})
Thread.belongsTo(User,{foreignKey : "senderId", as : "sender"})

Channel.hasMany(Thread,{foreignKey : "channelId"})
Thread.belongsTo(Channel, { foreignKey: "channelId"});

Server.hasMany(Channel , {foreignKey : 'serverId'})
Channel.belongsTo(Server,{foreignKey : "serverId"})

Thread.hasOne(Thread, { foreignKey: "parent_id"});
Thread.belongsTo(Thread, { foreignKey: "parent_id"});

export default function setAssociation(){
    console.log("Associations initilized.");
}