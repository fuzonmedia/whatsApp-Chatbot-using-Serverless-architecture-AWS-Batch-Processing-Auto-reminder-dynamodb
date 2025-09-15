// Import the required dependencies and set up variables
const axios = require('axios');
const AWS = require('aws-sdk');

// Set the desired region
const region = 'us-east-1'; // Replace with your desired region

// Configure AWS SDK
AWS.config.update({ region });

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const REVIEW_TABLE = "reviews";
const TOKEN_TABLE = "whatsappToken";
const attributeName = "Message on " + new Date().toISOString();
let WHATSAPP_TOKEN = "Bearer ";
let WHATSAPP_SENDER_ID = "";
let WHATSAPP_API_URL = "";

// Retrieve the WhatsApp token using the getWhatsappToken function
(async () => {
  try {
    const tokenData = await getWhatsappToken(TOKEN_TABLE);

    if (tokenData) {
      const { temporaryAccessToken, whatsappAPIURL, whatsappSenderId } = tokenData;

      // Use the values as needed
      console.log('Temporary Access Token:', temporaryAccessToken);
      console.log('WhatsApp API URL:', whatsappAPIURL);
      console.log('WhatsApp Sender ID:', whatsappSenderId);

      // You can store the values in separate variables if required
      WHATSAPP_TOKEN = WHATSAPP_TOKEN + temporaryAccessToken;
      WHATSAPP_API_URL = whatsappAPIURL;
      WHATSAPP_SENDER_ID = whatsappSenderId;

    } else {
      console.log('No token data found.');
    }
  } catch (error) {
    console.error('Error:', error);
    WHATSAPP_TOKEN = null;
    console.log('WhatsApp Token: ', WHATSAPP_TOKEN);
  }
})();

module.exports = async ( phoneNumber, templateName ) => {

    // if( !req.headers['x-access-token'] || !req.headers['x-access-token']==process.env.PRIVATE_API_TOKEN){
    //   throw new Error('Access Denied: Auth Header missing/Invalid')
    // }
    
    const template = {
      name: templateName,
      language: {
        code: 'en',
      },
    }
    const params = {
      TableName: REVIEW_TABLE,
      Key: {
        'phoneNumber': phoneNumber
      },
      UpdateExpression: `SET #attr = :messageDetails`,
      ExpressionAttributeNames: {
        '#attr': attributeName
      },
      ExpressionAttributeValues: {
        ':messageDetails': {
          template: template,
          createdAt: new Date().toISOString(),
        }
      }
    };

    dynamoDb.update(params, (error) => {
        if (error) {
          console.log(error);
          throw error;
        }
    
        try {  
          axios({
            method: "POST",
            url:
              WHATSAPP_API_URL + //process.env.WHATSAPP_API_URL
              WHATSAPP_SENDER_ID + //process.env.WHATSAPP_SENDER_ID
              "/messages",
            data: {
              messaging_product: "whatsapp",
              to: phoneNumber,
              type: "template",
              template: template,
            },
            headers: {
              "Content-Type": "application/json",
              "Authorization": WHATSAPP_TOKEN,
            },
          })
          .then((response) => {
            console.log (response.data);
            return;
          }) 
          .catch ((error) => {
            throw error;
          });
        } catch (error) {
          throw error;
        }
        updateLastTemplateGroup(REVIEW_TABLE, phoneNumber)
        updateLastTemplateSent(REVIEW_TABLE, phoneNumber, templateName);
        updateLastMessageSentAt(REVIEW_TABLE, phoneNumber);
        updateIsReplyReceived(REVIEW_TABLE, phoneNumber);
    });
}

function updateLastTemplateSent(tableName, phoneNumber, templateName) {
  const params = {
    TableName: tableName,
    Key: {
      phoneNumber: phoneNumber
    },
    UpdateExpression: 'SET lastTemplateSent = :templateDetails',
    ExpressionAttributeValues: {
      ':templateDetails': templateName
    }
  };
  
  dynamoDb.update(params, (error) => {
    if (error) {
      throw error;
    }

    // Item updated successfully
    console.log('lastTemplateSent updated in DynamoDB');
  });
}

function updateLastMessageSentAt(tableName,phoneNumber) {
  const params = {
    TableName: tableName,
    Key: {
      phoneNumber: phoneNumber
    },
    UpdateExpression: 'SET lastMessageSentAt = :currentDate',
    ExpressionAttributeValues: {
      ':currentDate': new Date().toISOString()
    }
  };
  
  dynamoDb.update(params, (error) => {
    if (error) {
      throw error;
    }

    // Item updated successfully
    console.log('lastMessageSentAt updated in DynamoDB');
  });
}

function updateIsReplyReceived(tableName, phoneNumber, replyRecvd = false) {
  const params = {
    TableName: tableName,
    Key: {
      phoneNumber: phoneNumber
    },
    UpdateExpression: 'SET isReplyReceived = :replyRecvd',
    ExpressionAttributeValues: {
      ':replyRecvd': replyRecvd
    }
  };
  
  dynamoDb.update(params, (error) => {
    if (error) {
      throw error;
    }

    // Item updated successfully
    console.log('isReplyReceived updated in DynamoDB');
  });
}

function updateLastTemplateGroup(tableName, phoneNumber, templateGroup = 'msg') {
  const params = {
    TableName: tableName,
    Key: {
      phoneNumber: phoneNumber
    },
    UpdateExpression: 'SET lastTemplateGroup = :templateGroup',
    ExpressionAttributeValues: {
      ':templateGroup': templateGroup
    }
  };
  
  dynamoDb.update(params, (error) => {
    if (error) {
      throw error;
    }

    // Item updated successfully
    console.log('lastTemplateGroup updated in DynamoDB');
  });
}

function updateIsReminderSent(tableName, phoneNumber, reminderSent = false) {
  const params = {
    TableName: tableName,
    Key: {
      phoneNumber: phoneNumber
    },
    UpdateExpression: 'SET isReminderSent = :reminderSent',
    ExpressionAttributeValues: {
      ':reminderSent': reminderSent
    }
  };
  
  dynamoDb.update(params, (error) => {
    if (error) {
      throw error;
    }

    // Item updated successfully
    console.log('isReminderSent updated in DynamoDB');
  });
}

async function getWhatsappToken(tableName, companyName = "NRINation") {
  const params = {
    TableName: tableName,
    Key: {
      'companyName': companyName,
    },
    ProjectionExpression: 'temporaryAccessToken, whatsappAPIURL, whatsappSenderId',
  };

  try {
    const result = await dynamoDb.get(params).promise();
    const item = result.Item;
    
    if (item) {
      const temporaryAccessToken = item['temporaryAccessToken'];
      const whatsappAPIURL = item['whatsappAPIURL'];
      const whatsappSenderId = item['whatsappSenderId'];
      return {
        temporaryAccessToken,
        whatsappAPIURL,
        whatsappSenderId,
      };
    } else {
      return null; // No matching item found
    }
  } catch (error) {
    console.error('Error retrieving temporary access token from DynamoDB', error);
    throw error;
  }
}