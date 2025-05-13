import { DataTypes } from 'sequelize';
import {sequelize} from '../../db/postgres.js';

const Thread = sequelize.define('Thread', {
  id : {
    type : DataTypes.UUID,
    defaultValue : DataTypes.UUIDV4,
    primaryKey : true,
    allowNull:false,
  },
  channelId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  senderId : {
    type : DataTypes.UUID,
    allowNull : false,
  },
  parent_id : { // Self refrencing for nesting threads
    type : DataTypes.UUID,
    defaultValue : undefined,
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
export default Thread;