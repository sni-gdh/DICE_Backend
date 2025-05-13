import {sequelize} from '../../db/postgres.js'
import { DataTypes } from 'sequelize';
const SocialFacultyprofile = sequelize.define('FacultyProfile',{
    id : {
        type : DataTypes.UUID,
        defaultValue : DataTypes.UUIDV4,
        primaryKey : true,
        allowNull:false,
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
        allownull : false,
        set(value) {
            this.setDataValue('lastName', value.toLowerCase().trim());
          }  
    },
    bio : {
        type : DataTypes.STRING,
        allownull : true,
        defaultValue : "", 
    },
    Department : {
        type : DataTypes.STRING,
        allowNULL:true
      },
    Designation : {
        type : DataTypes.STRING,
        allowNULL:true
      },
    owner: {
        type: DataTypes.UUID,
        allowNull: false,
    }
})

export { SocialFacultyprofile };

