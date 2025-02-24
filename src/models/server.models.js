import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../db/postgres.js';
import User from './user.models.js';

const Server = sequelize.define('Server', {
  server_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  admin: {
    type: DataTypes.INTEGER,
    refrences:{
      model : User,
      key : 'id'
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
  members: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false,
  },
});

User.hasMany(Server,{foreignKey : "admin",as : "adminServer"})
Server.belongsTo(User,{foreignKey : "admin", as : "admin"})

export default Server;