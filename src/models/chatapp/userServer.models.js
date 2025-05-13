import {DataTypes} from 'sequelize'
import {sequelize} from '../../db/postgres.js'

const serverUser = sequelize.define('serverUser',{
    userId :{
       type: DataTypes.UUID,
       allowNull : false
    } ,
    serverId : {
        type : DataTypes.UUID,
        allowNull : false
    }
})
export default serverUser