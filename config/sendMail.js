const nodeMailer = require("nodemailer")
require("dotenv").config()

//Mailtrap
const sendMail = (to, text) => {
  var transport = nodeMailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "e89dd04b633d6a",
      pass: "4382eb4f2031a6"
    }
  })

//Check email in Mailtrap
const options = {
  from: "AdminEWSD@email.com",
  to: to,
  subject: "This is auto email, please don't reply",
  text: text,
} 
  return transport.sendMail(options);
}

module.exports = {
  sendMail: sendMail,
};
