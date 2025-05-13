import {sequelize} from '../../db/postgres.js'
import { DataTypes } from 'sequelize';
const Socialprofile = sequelize.define('Profile',{
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    firstName : {
        type: DataTypes.STRING,
        allownull : false,
        set(value) {
            this.setDataValue('firstName', value.toLowerCase().trim());
          }        
    },
    lastName : {
        type: DataTypes.STRING,
        set(value) {
            this.setDataValue('lastName', value.toLowerCase().trim());
          }  
    },
    bio : {
        type : DataTypes.STRING,
        allownull : true,
        defaultValue : "", 
    },
    program : {
        type:DataTypes.STRING,
        allowNULL:false
      },
      course : {
        type:DataTypes.STRING,
        allowNULL:false
      },
      section : {
        type:DataTypes.STRING,
        allowNULL:false
      },
      join_year : {
        type:DataTypes.INTEGER,
        allowNULL:false
      },
    owner: {
        type: DataTypes.UUID,
        allowNull: false,
    }
})

export { Socialprofile };

