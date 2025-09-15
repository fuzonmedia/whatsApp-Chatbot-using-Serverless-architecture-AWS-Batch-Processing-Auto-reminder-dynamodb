const AWS = require('aws-sdk');

// Set the desired region
const region = 'us-east-1'; // Replace with your desired region

// Configure AWS SDK
AWS.config.update({ region });

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const createJob = require('./next-day-message.js');

module.exports.run = async (event, context) => {

  const currentTime = new Date();

  // For sending next day message after 24 hours use the following code
  // const twentyFourHoursAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000).toISOString();
  
  // For sending next day message after 20 minutes [test mode] use the following code
  const twentyFourHoursAgo = new Date(currentTime.getTime() - 20 * 60 * 1000).toISOString();

  const params = {
    TableName: process.env.REVIEW_TABLE,
    ProjectionExpression: 'phoneNumber, nextTemplateToBeSent',
    FilterExpression: 'lastMessageSentAt < :twentyFourHoursAgo and isReplyReceived = :isReplyReceived and isReminderSent = :isReminderSent and lastTemplateGroup = :lastTemplateGroup',
    ExpressionAttributeValues: {
      ':twentyFourHoursAgo': twentyFourHoursAgo,
      ':isReplyReceived': false,
      ':isReminderSent': false,
      ':lastTemplateGroup': 'ack'
    }
  };

  try {
    const result = await dynamoDb.scan(params).promise();
    const items = result.Items;
    console.log("items >>>>");
    console.dir(items);
    for (const item of items) {
        const phoneNumber = item.phoneNumber;
        const templateName = item.nextTemplateToBeSent;
        console.log(`phoneNumber >>> ${phoneNumber}`);
        console.log(`templateName >>> ${templateName}`);
        await createJob(phoneNumber, templateName);
        console.log(`Next Day Message Job for ${phoneNumber} created`);
    }
    console.log('Next Day Message Jobs create finished');
  } catch (error) {
    console.error('Error retrieving phone numbers from DynamoDB', error);
    throw error;
  }
}

