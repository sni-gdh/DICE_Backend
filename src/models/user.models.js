import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../db/postgres.js';

const User = sequelize.define('User', {
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
      url: "https://via.placeholder.com/200x200.png",
      localPath: ""
    }
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
    type:DataTypes.STRING,
    allowNULL:false
  },
  refreshtoken:{
    type:DataTypes.STRING,
    allowNull: true
  },
  forgetPasswordToken:{
    type:DataTypes.STRING,
    allowNull: true
  },
  forgotPasswordExpiry:{
    type:DataTypes.STRING,
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