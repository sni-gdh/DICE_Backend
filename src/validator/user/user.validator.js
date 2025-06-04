import {body , param} from "express-validator"
import { AvailableUserRoles } from "../../constants.js"


const userRegisterValidator = ()=>{
    return [
        body("univ_mail").
        notEmpty().
        withMessage("Univ_mail is Required").
        isEmail().
        withMessage("Univ_mail is invalid"),
        body("name").
        trim().
        notEmpty().
        withMessage("Username is required").
        isLowercase().
        withMessage("Username must be in LowerCase").
        isLength({min : 3}).
        withMessage("username must be at least 3 character long"),
        body("password").trim().notEmpty().withMessage("Password is required"),
    ];
};
const userLoginValidator = ()=>{
    return [
        body("univ_mail").optional().isEmail().withMessage("Email is invalid"),
        body("name").optional(),
        body("password").notEmpty().withMessage("password is required"),
    ];
};

const userChangeCurrentPasswordValidator = ()=>{
    return [
        body("oldPassword").notEmpty().withMessage("Old password is required"),
        body("newPassword").notEmpty().withMessage("New password is required"),
    ];
};

const userForgotPasswordValidator = ()=>{
    return[
        body("univ_mail").notEmpty().withMessage("Email is required").isEmail().withMessage("Email is invalid")
    ];
}

const userResetForgottenPasswordValidator = ()=>{
    return [
        body("newPassword").notEmpty().withMessage("Password is required")
    ];
};

const userAssignRoleValidator = ()=>{
    return[
        body("status").notEmpty()
        .customSanitizer(value => value.toUpperCase())
        .isIn(AvailableUserRoles)
        .withMessage("Invalid user role")
    ];
};


export {
    userRegisterValidator,
    userLoginValidator,
    userChangeCurrentPasswordValidator,
    userForgotPasswordValidator,
    userResetForgottenPasswordValidator,
    userAssignRoleValidator
}