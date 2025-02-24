const emailValidation = (email)=>{
  if(!email)
  {
    return false;
  }
var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if (email.match(validRegex)) {
    return true;
  } 
  return false;
}

const passwordValidation = (password) =>{
  if(!password)
  {
    return false;
  }
    const hasNumber = /\d/;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

    if (password.length > 8 && hasNumber.test(password) && hasSpecialChar.test(password)) {
       return true;
    } 
    return false;
}


export { emailValidation , passwordValidation}