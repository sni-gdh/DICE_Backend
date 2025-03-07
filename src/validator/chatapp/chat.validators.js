import {body} from "express-validator"

const createAGroupChatValidator = ()=>{
    return[
        body("name").trim().notEmpty().withMessage("Community name is required"),
        body("participants").isArray({
            min : 2,
            max : 100,
        }).withMessage("participants must be an array with more than 2 members and less than 100 members"),
    ];
};

const ParticipnatValidator = ()=>{
    return [
        body("participants").isArray({
            min : 1,
            max : 5
        }).withMessage("participants must be an array with more than 1 member and less than 5 member")
    ]
}

const updateGroupChatNameValidator = ()=>{
    return [
        body("name").trim().notEmpty().withMessage("Community name is required")
    ];
};

export {createAGroupChatValidator,updateGroupChatNameValidator,ParticipnatValidator}