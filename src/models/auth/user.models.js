import { DataTypes, DATE } from 'sequelize';
import {sequelize} from '../../db/postgres.js';
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { USER_TEMPORARY_TOKEN_EXPIRY } from '../../constants.js'
// import ChannelUser from './userChannel.models.js'
// import Server from './server.models.js'
const User = sequelize.define('User', {
  id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      this.setDataValue('name', value.toLowerCase().trim());
    }
  },
  univ_mail:{
    type: DataTypes.STRING,
    allowNull:false,
    unique: true,
    set(value) {
      this.setDataValue('univ_mail', value.toLowerCase().trim());
    }
  },
  password:{
    type:DataTypes.STRING,
    allowNULL : false,
  },
  avatar: {
    type: DataTypes.JSON, // Store as a stringified JSON
    allowNull: false,
    defaultValue: {
      url: "https://res.cloudinary.com/ddyuwxg3o/image/upload/v1741023486/dog_us6tqk.jpg",
      localPath: ""
    }
  },
  role : {
    type : DataTypes.ENUM("STUDENT", "PRIVILEGED_STUDENT","FACULTY", "ADMIN","NAN"),
    defaultValue : "NAN",
    allowNull : false,
  },
  token : {
    type : DataTypes.STRING,
    allownull : false,
  },
  refreshtoken:{
    type:DataTypes.STRING,
    allowNull: true
  },
  forgotPasswordToken:{
    type:DataTypes.STRING,
    allowNull: true
  },
  forgotPasswordExpiry:{
    type:DataTypes.DATE,
    allowNull: true
  },
  isEmailVerified:{
    type:DataTypes.BOOLEAN,
    defaultValue:false
  },
  emailVerificationToken : {
    type:DataTypes.STRING,
    allowNull: true
  },
  emailVerificationExpiry:{
    type:DataTypes.DATE,
    allowNull: true
  }
});



User.beforeCreate(async (user) => {
  if (!user.changed('password')) {
    return;
  }
  user.password = await bcrypt.hash(user.password, 10);
});

User.beforeUpdate(async (user) => {
  if (!user.changed('password')) {
    return;
  }
  user.password = await bcrypt.hash(user.password, 10);
});


// User.afterCreate(async (user) => {
//   const socialProfile = await SocialProfile.findOne({ where: { owner: user.id } });
//   if (!socialProfile) {
//     await SocialProfile.create({ owner: user.id });
//   }
// });

User.prototype.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this.id,
      univ_mail: this.univ_mail,
      userName  : this.name,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

User.prototype.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

User.prototype.generateTemporaryToken = function () {
  const unHashedToken = crypto.randomBytes(20).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(unHashedToken).digest('hex');
  const tokenExpiry = Date.now() + USER_TEMPORARY_TOKEN_EXPIRY;

  return { unHashedToken, hashedToken, tokenExpiry };
};

export default User;