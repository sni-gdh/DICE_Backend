import {body , param} from "express-validator"
import pkg from 'validator';
const { isUUID } = pkg;

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
        param(idName).notEmpty().isInt().withMessage(`Invalid ${idName}`),
    ]
 };
//  export const serverIdValidator = () => {
//     return [
//       param("serverId").notEmpty().isInt().withMessage("Invalid Server id"),
//     ];
//  }
 /**
  * @param {string} idName
  * @discription a common validator to validate database id passed in the request body.
  */
 export const mongoIdRequestBodyValidator = (idName)=>{
    return [
        body(idName).notEmpty().isMongoId().withMessage(`Invalid ${idName}`)
    ];
 };

