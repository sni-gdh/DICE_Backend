import {sequelize} from '../../db/postgres.js'
import User from './../auth/user.models.js'
import Server from './server.models.js'
import Channel from './channel.models.js'
import Thread from './threads.models.js'
import setAssociation from './associations.js'
import {Message} from './message.models.js'
import userServer from './userServer.models.js'
import ChannelUser from './userChannel.models.js'
// initialize association
setAssociation();

export {
    sequelize,
    User,
    Server,
    Channel,
    Thread,
    Message,
    userServer,
    ChannelUser,
}