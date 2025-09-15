const sendMessage = require('./jobs/sendMessage.js');

const { program } = require('commander');
const sendReminder = require('./jobs/sendReminder.js');

program
  .command('message:send')
  .argument('<phone-number>', "Reciepient's Phone Number")
  .argument('<template-name>', "Template's name to send as message")
  .action((phoneNumber,template) => {
    sendMessage(phoneNumber,template);
  });

program
  .command('reminder:send')
  .argument('<phone-number>', "Reciepient's Phone Number")
  .argument('<template-name>', "Template's name to send as message")
  .action((phoneNumber,template) => {
    sendReminder(phoneNumber,template);
  });

program.parse()