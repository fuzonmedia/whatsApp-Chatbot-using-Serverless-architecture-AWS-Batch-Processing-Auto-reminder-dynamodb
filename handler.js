// Import the required dependencies and set up variables
const serverless = require('serverless-http');
const express = require('express');
const app = express();

const axios = require('axios');
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const cors = require('cors');
// const createJob = require('./batch/next-day-message.js');

const token = process.env.TOKEN
const TOKEN_TABLE = process.env.TOKEN_TABLE 

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

// Define the templates object, which contains various templates for different messages
const templates = {
  welcome: {
    name: 'introductory_message',
    language: {
      code: 'en',
    },
  },
  day1: {
    name: 'day_1_first_message',
    language: {
      code: 'en',
    },
  },
  day1_ans1: {
    name: 'day_1_answer_1',
    language: {
      code: 'en',
    },
  },
  day1_ans2: {
    name: 'day_1_answer_2',
    language: {
      code: 'en',
    },
  },
  day2: {
    name: 'day_2_first_message',
    language: {
      code: 'en',
    },
  },
  day2_ans1: {
    name: 'day_2_answer_1',
    language: {
      code: 'en',
    },
  },
  day2_ans2: {
    name: 'day_2_answer_2',
    language: {
      code: 'en',
    },
  },
  day3: {
    name: 'day_3_first_message',
    language: {
      code: 'en',
    },
  },
  day3_ans1: {
    name: 'day_3_answer_1',
    language: {
      code: 'en',
    },
  },
  day3_ans2: {
    name: 'day_3_answer_2',
    language: {
      code: 'en',
    },
  },
  day3_ans3: {
    name: 'day_3_answer_3',
    language: {
      code: 'en',
    },
  },
  day4: {
    name: 'day_4_first_message',
    language: {
      code: 'en',
    },
  },
  day4_ans1: {
    name: 'day_4_answer_1',
    language: {
      code: 'en',
    },
  },
  day4_ans2: {
    name: 'day_4_answer_2',
    language: {
      code: 'en',
    },
  },
  day4_ans3: {
    name: 'day_4_answer_3',
    language: {
      code: 'en',
    },
  },
  day5: {
    name: 'day_5_first_message',
    language: {
      code: 'en',
    },
  },
  day5_ans1: {
    name: 'day_5_answer_1',
    language: {
      code: 'en',
    },
  },
  day5_ans2: {
    name: 'day_5_answer_2',
    language: {
      code: 'en',
    },
  },
  day5_ans3: {
    name: 'day_5_answer_3',
    language: {
      code: 'en',
    },
  },
};

// Define the replies object, which contains different reply options for the user
const replies = {
  initReply: 'start',
  day1reply1: 'quick share this cure now',
  day1reply2: 'verify from health source',
  day2reply1: 'trust and forward',
  day2reply2: 'investigate then share?',
  day3reply1: 'share to alert followers',
  day3reply2: 'express outrage',
  day3reply3: 'research before sharing',
  day4reply1: 'comment & ask factguru101',
  day4reply2: 'search reliable news',
  day4reply3: 'share & ask followers',
  day5reply1: 'not confident',
  day5reply2: 'somewhat confident',
  day5reply3: 'very confident',
  endReply: 'stop',
};

app.use(cors({origin:'https://www.mynrination.com'}))

// Route to verify token while configuring webhook from WhatsApp Meta
// Do not DELETE this 
app.get('/webhooks', (req, res) => {
  if (
    req.query['hub.mode'] == 'subscribe' &&
    req.query['hub.verify_token'] == token
  ) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
})

// Route to send Welcome message
app.post('/initiate',  (req, res) => {
  const body = JSON.parse(req.body)
  const phoneNumber = body.to;
  const initialDetails = {
    createdAt: new Date().toISOString(),
    template: templates.welcome
  };
  const templateGroup = "msg";
  const lastTemplateSent = templates.welcome.name;
  const nextTemplateToBeSent = templates.day1.name;
  const lastMessageSentAt = new Date().toISOString();
  const isReplyReceived = false;
  const isReminderSent = false;
  const params = {
    TableName: process.env.REVIEW_TABLE,
    Item: {
      phoneNumber: phoneNumber,
      initialDetails: initialDetails,
      lastTemplateGroup: templateGroup,
      lastTemplateSent: lastTemplateSent,
      lastMessageSentAt: lastMessageSentAt,
      nextTemplateToBeSent: nextTemplateToBeSent,
      isReplyReceived: isReplyReceived,
      isReminderSent: isReminderSent
    }
  };
  dynamoDb.put(params, (error) => {
    if (error) {
      return res.status(500).json({ status: "fail", message: "Failed to create item in DynamoDB", error: error });
    }

    try {  
      axios({
        method: "POST",
        url:
          WHATSAPP_API_URL +
          WHATSAPP_SENDER_ID +
          "/messages",
        data: {
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "template",
          template: templates.welcome,
        },
        headers: {
          "Content-Type": "application/json",
          "Authorization": WHATSAPP_TOKEN
        },
      })
      .then((response) => {
        return res.status(200).json({ status: "success", response: response.data });
      }) 
      .catch ((error) => {
        return res.status(200).json({ status: "fail", error: "message initiator error #2", error: error.message });
      });
    } catch (error) {
      return res.status(200).json({ status: "fail", error: "message initiator error #3", message: `Internal server error: ${error}` });
    }
  });
});

// Route to listen to reply from receiver and then send another message
app.post('/webhooks', (req, res) => {
  const recvdData = JSON.parse(req.body);

  const tableName = process.env.REVIEW_TABLE;
  // Extract the replier's phone number and reply text
  const getPhoneTo = recvdData.entry[0].changes[0].value.contacts[0].wa_id ? recvdData.entry[0].changes[0].value.contacts[0].wa_id : recvdData.entry[0].changes[0].value.messages[0].from;
  const replyText = recvdData.entry[0].changes[0].value.messages[0].button.text;
  const hasMessagesField = recvdData.entry[0].changes[0].field === "messages";

  // Print the extracted values
  console.log('Replier\'s Phone Number:', getPhoneTo);
  console.log('Reply Message Text:', replyText);
  console.log('Field:', hasMessagesField);

  if (!hasMessagesField) {
    console.log('Invalid reply');
    updateDynamoDB(tableName, getPhoneTo, 'invalidReply', replyText, false, res);
    return;
  }

  // Handle different reply scenarios in the webhooks route
  switch (replyText.toLowerCase()) {
    case replies.initReply:
      updateIsReplyReceived(tableName,getPhoneTo,true);
      updateIsReminderSent(tableName,getPhoneTo);
      checkAndSendMessage(tableName,getPhoneTo, 'initialReply', replyText, true, templates.day1, res);
      updateLastTemplateSent(tableName,getPhoneTo,templates.day1.name);
      updateLastMessageSentAt(tableName,getPhoneTo);
      updateLastTemplateGroup(tableName,getPhoneTo);
      break;
    case replies.day1reply1:
      updateIsReplyReceived(tableName,getPhoneTo,true);
      updateIsReminderSent(tableName,getPhoneTo);
      checkAndSendMessage(tableName,getPhoneTo, 'day1Reply', replyText, true, templates.day1_ans1, res);
      updateLastTemplateSent(tableName,getPhoneTo,templates.day1_ans1.name);
      updateLastMessageSentAt(tableName,getPhoneTo);
      updateLastTemplateGroup(tableName,getPhoneTo,"ack");
      updateNextTemplateToBeSent(tableName,getPhoneTo,templates.day2.name);
      break;
    case replies.day1reply2 :
      updateIsReplyReceived(tableName,getPhoneTo,true);
      updateIsReminderSent(tableName,getPhoneTo);
      checkAndSendMessage(tableName,getPhoneTo, 'day1Reply', replyText, true, templates.day1_ans2, res);
      updateLastTemplateSent(tableName,getPhoneTo,templates.day1_ans2.name);
      updateLastMessageSentAt(tableName,getPhoneTo);
      updateLastTemplateGroup(tableName,getPhoneTo,"ack");
      updateNextTemplateToBeSent(tableName,getPhoneTo,templates.day2.name);
      break;
    case replies.day2reply1:
      updateIsReplyReceived(tableName,getPhoneTo,true);
      updateIsReminderSent(tableName,getPhoneTo);
      checkAndSendMessage(tableName,getPhoneTo, 'day2Reply', replyText, true, templates.day2_ans1, res);
      updateLastTemplateSent(tableName,getPhoneTo,templates.day2_ans1.name);
      updateLastMessageSentAt(tableName,getPhoneTo);
      updateLastTemplateGroup(tableName,getPhoneTo,"ack");
      updateNextTemplateToBeSent(tableName,getPhoneTo,templates.day3.name);
      break;
    case replies.day2reply2 :
      updateIsReplyReceived(tableName,getPhoneTo,true);
      updateIsReminderSent(tableName,getPhoneTo);
      checkAndSendMessage(tableName,getPhoneTo, 'day2Reply', replyText, true, templates.day2_ans2, res);
      updateLastTemplateSent(tableName,getPhoneTo,templates.day2_ans2.name);
      updateLastMessageSentAt(tableName,getPhoneTo);
      updateLastTemplateGroup(tableName,getPhoneTo,"ack");
      updateNextTemplateToBeSent(tableName,getPhoneTo,templates.day3.name);
      break;
    case replies.day3reply1:
      updateIsReplyReceived(tableName,getPhoneTo,true);
      updateIsReminderSent(tableName,getPhoneTo);
      checkAndSendMessage(tableName,getPhoneTo, 'day3Reply', replyText, true, templates.day3_ans1, res);
      updateLastTemplateSent(tableName,getPhoneTo,templates.day3_ans1.name);
      updateLastMessageSentAt(tableName,getPhoneTo);
      updateLastTemplateGroup(tableName,getPhoneTo,"ack");
      updateNextTemplateToBeSent(tableName,getPhoneTo,templates.day4.name);
      break;
    case replies.day3reply2:
      updateIsReplyReceived(tableName,getPhoneTo,true);
      updateIsReminderSent(tableName,getPhoneTo);
      checkAndSendMessage(tableName,getPhoneTo, 'day3Reply', replyText, true, templates.day3_ans2, res);
      updateLastTemplateSent(tableName,getPhoneTo,templates.day3_ans2.name);
      updateLastMessageSentAt(tableName,getPhoneTo);
      updateLastTemplateGroup(tableName,getPhoneTo,"ack");
      updateNextTemplateToBeSent(tableName,getPhoneTo,templates.day4.name);
      break;      
    case replies.day3reply3:
      updateIsReplyReceived(tableName,getPhoneTo,true);
      updateIsReminderSent(tableName,getPhoneTo);
      checkAndSendMessage(tableName,getPhoneTo, 'day3Reply', replyText, true, templates.day3_ans3, res);
      updateLastTemplateSent(tableName,getPhoneTo,templates.day3_ans3.name);
      updateLastMessageSentAt(tableName,getPhoneTo);
      updateLastTemplateGroup(tableName,getPhoneTo,"ack");
      updateNextTemplateToBeSent(tableName,getPhoneTo,templates.day4.name);
      break;      
    case replies.day4reply1:
      updateIsReplyReceived(tableName,getPhoneTo,true);
      updateIsReminderSent(tableName,getPhoneTo);
      checkAndSendMessage(tableName,getPhoneTo, 'day4Reply', replyText, true, templates.day4_ans1, res);
      updateLastTemplateSent(tableName,getPhoneTo,templates.day4_ans1.name);
      updateLastMessageSentAt(tableName,getPhoneTo);
      updateLastTemplateGroup(tableName,getPhoneTo,"ack");
      updateNextTemplateToBeSent(tableName,getPhoneTo,templates.day5.name);
      break;      
    case replies.day4reply2:
      updateIsReplyReceived(tableName,getPhoneTo,true);
      updateIsReminderSent(tableName,getPhoneTo);
      checkAndSendMessage(tableName,getPhoneTo, 'day4Reply', replyText, true, templates.day4_ans2, res);
      updateLastTemplateSent(tableName,getPhoneTo,templates.day4_ans2.name);
      updateLastMessageSentAt(tableName,getPhoneTo);
      updateLastTemplateGroup(tableName,getPhoneTo,"ack");
      updateNextTemplateToBeSent(tableName,getPhoneTo,templates.day5.name);
      break;      
    case replies.day4reply3:
      updateIsReplyReceived(tableName,getPhoneTo,true);
      updateIsReminderSent(tableName,getPhoneTo);
      checkAndSendMessage(tableName,getPhoneTo, 'day4Reply', replyText, true, templates.day4_ans3, res);
      updateLastTemplateSent(tableName,getPhoneTo,templates.day4_ans3.name);
      updateLastMessageSentAt(tableName,getPhoneTo);
      updateLastTemplateGroup(tableName,getPhoneTo,"ack");
      updateNextTemplateToBeSent(tableName,getPhoneTo,templates.day5.name);
      break;
    case replies.day5reply1:
      updateIsReplyReceived(tableName,getPhoneTo,true);
      updateIsReminderSent(tableName,getPhoneTo);
      checkAndSendMessage(tableName,getPhoneTo, 'day5Reply', replyText, false, templates.day5_ans1, res);
      updateLastTemplateSent(tableName,getPhoneTo,templates.day5_ans1.name);
      updateLastMessageSentAt(tableName,getPhoneTo);
      updateLastTemplateGroup(tableName,getPhoneTo,"ack");
      break;
    case replies.day5reply2:
      updateIsReplyReceived(tableName,getPhoneTo,true);
      updateIsReminderSent(tableName,getPhoneTo);
      checkAndSendMessage(tableName,getPhoneTo, 'day5Reply', replyText, false, templates.day5_ans2, res);
      updateLastTemplateSent(tableName,getPhoneTo,templates.day5_ans2.name);
      updateLastMessageSentAt(tableName,getPhoneTo);
      updateLastTemplateGroup(tableName,getPhoneTo,"ack");
      break;
    case replies.day5reply3:
      updateIsReplyReceived(tableName,getPhoneTo,true);
      updateIsReminderSent(tableName,getPhoneTo);
      checkAndSendMessage(tableName,getPhoneTo, 'day5Reply', replyText, false, templates.day5_ans3, res);
      updateLastTemplateSent(tableName,getPhoneTo,templates.day5_ans3.name);
      updateLastMessageSentAt(tableName,getPhoneTo);
      updateLastTemplateGroup(tableName,getPhoneTo,"ack");
      break;
    case replies.endReply:
      updateIsReplyReceived(tableName,getPhoneTo,true);
      updateIsReminderSent(tableName,getPhoneTo);
      updateDynamoDB(tableName,getPhoneTo, 'terminationReply', replyText, false, res);
      break;
    default:
      console.log('Invalid reply');
      updateIsReplyReceived(tableName,getPhoneTo,false);
      updateIsReminderSent(tableName,getPhoneTo);
      updateDynamoDB(tableName,getPhoneTo, 'invalidReply', replyText, false, res);
      break;
  }
});

function updateDynamoDB(tableName, phoneNumber, attributeName, replyText, sentNextMessage, template = 'NA', res) {
  const params = {
    TableName: tableName,
    Key: {
      'phoneNumber': phoneNumber
    },
    UpdateExpression: `SET #attr = :replyDetails`,
    ExpressionAttributeNames: {
      '#attr': attributeName
    },
    ExpressionAttributeValues: {
      ':replyDetails': {
        reply: replyText,
        template: template,
        sentNextMessage: sentNextMessage,
        createdAt: new Date().toISOString(),
      }
    }
  };

  dynamoDb.update(params, (error) => {
    if (error) {
      console.log("DynamoDB Update Error:", error);
      return res.status(500).json({ status: "fail", message: "Failed to update item in DynamoDB", error: error });
    } else {
      if (!sentNextMessage) {
        console.log("Successfully updated item in DynamoDB");
        return res.status(200).json({ status: "success", message: "Successfully updated item in DynamoDB" });
      } else {
        console.log("Successfully updated item in DynamoDB");
        return;
      }
    }
  });
}

function checkAndSendMessage(tableName, phoneNumber, attributeName, replyText, sentNextMessage, template, res) {
  const params = {
    TableName: tableName,
    Key: {
      'phoneNumber': phoneNumber
    },
    ProjectionExpression: attributeName,
    ConditionExpression: `attribute_exists(${attributeName})`
  };
  console.log(`attribute_to_check: ${attributeName}`);
  dynamoDb.get(params, (error, data) => {
    if (error) {
      console.error('DynamoDB GetItem Error:', error);
      // Handle the error
      return res.status(500).json({ status: "fail", message: "DynamoDB GetItem Error", error: error });
    } else {
      const attributeExists = !!data.Item && attributeName in data.Item;
      console.log('Attribute Exists:', attributeExists);

      if (!attributeExists) {
        updateDynamoDB(tableName, phoneNumber, attributeName, replyText, sentNextMessage, template, res);

        try {
          axios({
            method: "POST",
            url: WHATSAPP_API_URL + WHATSAPP_SENDER_ID + "/messages",
            data: {
              messaging_product: "whatsapp",
              to: phoneNumber,
              type: "template",
              template: template,
            },
            headers: {
              "Content-Type": "application/json",
              "Authorization": WHATSAPP_TOKEN
            },
          })
          .then((response) => {
            updateIsReplyReceived(tableName, phoneNumber);
            console.log("Reply response >>> " + response.data);
            return res.status(200).json({ status: "success", response: response.data });
          })
          .catch((error) => {
            console.log("Reply Error >>> " + error.message);
            return res.status(200).json({ status: "fail", error: error.message });
          });
        } catch (error) {
          console.log("TRY_CATCH error >>> " + error);
          return res.status(200).json({ status: "fail", error: "message sending error #3", message: `Internal server error: ${error}` });
        }
      } else {
        // Attribute already exists, no need to update or send a message
        return res.status(200).json({ status: "success", message: "Attribute already exists" });
      }
    }
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

function updateLastMessageSentAt(tableName, phoneNumber) {
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

function updateNextTemplateToBeSent(tableName, phoneNumber, templateName) {
  const params = {
    TableName: tableName,
    Key: {
      phoneNumber: phoneNumber
    },
    UpdateExpression: 'SET nextTemplateToBeSent = :templateDetails',
    ExpressionAttributeValues: {
      ':templateDetails': templateName
    }
  };
  
  dynamoDb.update(params, (error) => {
    if (error) {
      throw error;
    }

    // Item updated successfully
    console.log('nextTemplateToBeSent updated in DynamoDB');
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

module.exports.handler = serverless(app);