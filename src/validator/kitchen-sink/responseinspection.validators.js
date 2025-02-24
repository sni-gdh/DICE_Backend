import { param } from "express-validator"

const setCacheControlHeaderValidator = () => {
    return [
        param("timeToLive").
        notEmpty().
        withMessage("Time to Live is missing").
        isNumeric().
        withMessage("Time to Live must be a number"),
        param("cacheResponseDirective").
        notEmpty().
        isIn(["public","private"]).
        withMessage("Invalid cache directive")
    ];
};

export { setCacheControlHeaderValidator }