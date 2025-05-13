import {body , param} from "express-validator"
 /**
  * 
  * @param {string} idName
  * @discription a common validator to validate database id passed in the URL's path variable
  */

 export const mongoIdPathVariableValidator = (idName)=>{
    return [
        param(idName).notEmpty().isMongoId().withMessage(`Invalid ${idName}`),
    ];
 };

 export const PostgresPathVariableValidator = (idName)=>{
    return [
        param(idName).notEmpty().isUUID().withMessage(`Invalid ${idName}`),
    ]
 };

 /**
  * @param {string} idName
  * @discription a common validator to validate database id passed in the request body.
  */
 export const mongoIdRequestBodyValidator = (idName)=>{
    return [
        body(idName).notEmpty().isMongoId().withMessage(`Invalid ${idName}`)
    ];
 };

