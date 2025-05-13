import { body,param } from "express-validator";

const statusValidator = ()=>{
    return [
        body("status").
        trim().
        notEmpty().
        withMessage("Status is required").
        isString().
        withMessage("Status must be a string").
        isIn(["accepted","rejected"]).
        withMessage("Status must be either accepted or rejected")
    ]
}

export { statusValidator };