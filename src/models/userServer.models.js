import {DataTypes} from 'sequelize'
import {sequelize} from '../db/postgres.js'

const serverUser = sequelize.define('serverUser',{
    userId :{
       type: DataTypes.INTEGER,
       allowNull : false
    } ,
    serverId : {
        type : DataTypes.INTEGER,
        allowNull : false
    }
})
export default serverUser