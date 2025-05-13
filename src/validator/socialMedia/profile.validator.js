import {body,param} from "express-validator"

const CreateSocialprofileValidator = ()=>{
    return [
       body("firstName")
             .trim()
             .notEmpty()
             .withMessage("firstName is required"),
        body("lastName")
              .optional()
              .trim()
              .notEmpty()
              .withMessage("lastName is required"),body("program").trim().notEmpty().withMessage("Program is required"),
        body("course").trim().notEmpty().withMessage("Course is required"),
        body("program").trim().notEmpty().withMessage("program is required"),
        body("section").trim().notEmpty().withMessage("Section is required"),
        body("join_year").notEmpty().isInt().withMessage("Join Year is required"),
        body("bio").trim().notEmpty().withMessage("Bio is required"),
    ]
}

const createSocialProfileFacultyAndAdminValidator = ()=>{
  return [
     body("firstName")
           .trim()
           .notEmpty()
           .withMessage("firstName is required"),
      body("lastName")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("lastName is required"),
      body("Department").trim().notEmpty().withMessage("Course is required"),
      body("Designation").trim().notEmpty().withMessage("program is required"),
      body("bio").trim().notEmpty().withMessage("Bio is required"),
  ]
}



const UpdateSocialprofileValidator = () =>{
  return [
    body("firstName")
          .optional()
          .trim()
          .notEmpty()
          .withMessage("firstName is required"),
     body("lastName")
           .optional()
           .trim()
           .notEmpty()
           .withMessage("lastName is required"),
     body("bio").optional().trim().notEmpty().withMessage("Bio is required"),
    ]
}
const getProfileByUserNameValidator = () => {
  return [
    param("username").trim().notEmpty().withMessage("Username is required"),
  ];
};

export { UpdateSocialprofileValidator ,CreateSocialprofileValidator, getProfileByUserNameValidator,createSocialProfileFacultyAndAdminValidator };
