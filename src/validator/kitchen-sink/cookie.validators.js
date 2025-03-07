import { query } from "express-validator"

const cookieKeyQueryStringValidator = ()=>{
    return [
        query("cookieKey").trim().notEmpty().withMessage("cookie Key is required"),
    ];
};

export { cookieKeyQueryStringValidator }