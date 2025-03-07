import { DataTypes } from 'sequelize';
import {sequelize} from '../db/postgres.js';

const Thread = sequelize.define('Thread', {
  channelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  senderId : {
    type : DataTypes.INTEGER,
    allowNull : false,
  },
  parent_id : { // Self refrencing for nesting threads
    type : DataTypes.INTEGER,
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