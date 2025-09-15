const AWS = require('aws-sdk');

// Set the desired region
const region = 'us-east-1'; // Replace with your desired region

// Configure AWS SDK
AWS.config.update({ region });

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const createReminderJob = require('./reminder-message.js');

module.exports.run = async (event, context) => {

  const currentTime = new Date();

  // For sending reminder after 24 hours use the following code
  // const twentyFourHoursAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // For sending reminder after 30 minutes [test mode] use the following code
  const twentyFourHoursAgo = new Date(currentTime.getTime() - 30 * 60 * 1000).toISOString();
  
  const params = {
    TableName: process.env.REVIEW_TABLE,
    ProjectionExpression: 'phoneNumber, lastTemplateSent',
    FilterExpression: 'lastMessageSentAt < :twentyFourHoursAgo and isReplyReceived = :isReplyReceived and isReminderSent = :isReminderSent and lastTemplateGroup = :lastTemplateGroup',
    ExpressionAttributeValues: {
      ':twentyFourHoursAgo': twentyFourHoursAgo,
      ':isReplyReceived': false,
      ':isReminderSent': false,
      ':lastTemplateGroup': 'msg'
    }
  };

  try {
    const result = await dynamoDb.scan(params).promise();
    const items = result.Items;
    console.log("items >>>>");
    console.dir(items);
  //   const phoneNumbers = items.map((item) => item.phoneNumber);
  //   const lastTemplateSentArray = items.map((item) => item.lastTemplateSent);

  //   return {
  //     phoneNumbers: phoneNumbers,
  //     lastTemplateSent: lastTemplateSentArray
  //   };
      for (const item of items) {
          const phoneNumber = item.phoneNumber;
          const templateName = item.lastTemplateSent;
          console.log(`phoneNumber >>> ${phoneNumber}`);
          console.log(`templateName >>> ${templateName}`);
          await createReminderJob(phoneNumber, templateName);
          console.log(`Reminder Message Job for ${phoneNumber} created`);
      }
      console.log('Reminder Message Jobs create finished');
  } catch (error) {
    console.error('Error retrieving phone numbers from DynamoDB', error);
    throw error;
  }
}

