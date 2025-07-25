import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import logger from "../logger/winston.logger.js"
// jsdoc comment to provide annotations, descriptions, and documentation for functions, methods, or other constructs 
/**
 *
 * @param {{email: string; subject: string; mailgenContent: Mailgen.Content; }} options
 */
// to send the mail in pretty format.
const sendEmail = async(options) => {
  const mailGenerator = new Mailgen({
    theme : 'default',
    product : {
        name : "BullitenFeed",
        link : "https://bullitenFeed.com",
    }
})



// Generate the plaintext version of the e-mail (for clients that do not support HTML)
var emailText = mailGenerator.generatePlaintext(options.mailgenContent);
// Generate an HTML email with the provided contents
var emailHtml = mailGenerator.generate(options.mailgenContent);

//  create a nodemailer transpoter instance which is responsible to send mail
const transporter = nodemailer.createTransport({
    host:process.env.MAILTRAP_SMTP_HOST ,
    port: process.env.MAILTRAP_SMTP_PORT ,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: "mail.bulletinFeed@gmail.com", // We can name this anything. The mail will go to your Mailtrap inbox
    to: options.email, // receiver's mail
    subject: options.subject, // mail subject
    text: emailText, // mailgen content textual variant
    html: emailHtml, // mailgen content html variant
  };

  try {
    await transporter.sendMail(mail)
  } catch (error) {
    // if mail not send we can silently generate an error rather than crashing the site.
    logger.error(
        "Email service failed silently. Make sure you have provided your MAILTRAP credentials in the .env file"
      );
      logger.error("Error: ", error);
  }
};
// ********************************************************************************************************************
/**
 *
 * @param {string} username
 * @param {string} verificationUrl
 * @returns {Mailgen.Content}
 * @description It designs the email verification mail
 */
  const emailVerificationMailgenContent = (username,verificationUrl)=>{
    return {
        body: {
            name: username,
            intro: 'Welcome to BullitenFeed! We\'re very excited to have you on board.',
            action: {
                instructions: 'To verify your univ_mail please click on the following button',
                button: {
                    color: '#22BC66', // Optional action button color
                    text: 'Verify your university_mail',
                    link: verificationUrl,
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        },
    };
  };
// ******************************************************************************************************************
  /**
 *
 * @param {string} username
 * @param {string} passwordResetUrl
 * @returns {Mailgen.Content}
 * @description It designs the forgot password mail
 */

  const forgotPasswordMailgenContent = (username,passwordResetUrl)=>{
    return {
        body: {
            name: username,
            intro: 'We got a request to reset the password of our account',
            action: {
                instructions: 'To reset your password click on the following button or link:',
                button: {
                    color: '#22BC66', // Optional action button color
                    text: 'Verify your university_mail',
                    link: passwordResetUrl,
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        },
    };
  };
// ********************************************************************************************************************
// ********************************************************************************************************************
const ConfirmRoleMailgenContent = (username,roleListURL)=>{
    return {
        body: {
            name: username,
            intro: 'We got a request to confirm the role for the account',
            action: {
                instructions: 'To see the pending list click on the following button or link:',
                button: {
                    color: '#22BC66', // Optional action button color
                    text: 'Approve the role',
                    link: roleListURL,
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        },
    };
  };


export {
    sendEmail,
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    ConfirmRoleMailgenContent
  }