import { query } from "express-validator"

const cookieKeyQueryStringValidation = ()=>{
    return [
        query("cookieKey").trim().notEmpty().withMessage("cookie Key is required"),
    ];
};

export { cookieKeyQueryStringValidation }