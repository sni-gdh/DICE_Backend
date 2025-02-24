import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const hashPassword = async (password) => {
    return await bcrypt.hash(password,10);
}

const isPasswordCorrect = async (password , previosPassword) => {
    return await bcrypt.compare(password,previosPassword);
}

const generateAccessToken = function (user_id,univ_mail,name){
    return jwt.sign(
        {
            _id : user_id,
            univ_mail : univ_mail,
            userName  : name,
        },process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
const generateRefreshToken = function (user_id){
    return jwt.sign(
        {
            _id : user_id,
           
        },process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

const generateTemporaryToken = function(){
    const unHashedToken = crypto.randomBytes(20).toString("hex");
    // hash the token before saving it to the database
    const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex");
    // tokenExpiry is the time when the token will expire starting from the current time
    const tokenExpiry = Date.now() + USER_TEMPORARY_TOKEN_EXPIRY;
    // return the unhashed token, hashed token and the expiry time
    return { unHashedToken, hashedToken, tokenExpiry };
}


export {
    hashPassword,
    isPasswordCorrect,
    generateAccessToken,
    generateRefreshToken,
    generateTemporaryToken
}