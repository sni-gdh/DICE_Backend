import { body } from "express-validator"


const sendMessageValidator = ()=>{
    return [
        body("content").
        trim().
        optional().
        notEmpty().
        withMessage("content is required")
    ];
};

return { sendMessageValidator }