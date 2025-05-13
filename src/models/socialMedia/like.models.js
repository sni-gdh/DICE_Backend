import {sequelize} from '../../db/postgres.js'
import { DataTypes } from 'sequelize';
const Sociallike = sequelize.define('like',{
    id : {
        type : DataTypes.UUID,
        defaultValue : DataTypes.UUIDV4,
        primaryKey : true,
        allowNull:false,
      },
    postId : {
        type : DataTypes.STRING,
        required : true,
        defaultValue : null,
    },
    commentId : {
        type : DataTypes.STRING,
        required : true,
        defaultValue : null
    },
    likedBy:{
        type : DataTypes.INTEGER,
        required : true,
    }
})

export default Sociallike