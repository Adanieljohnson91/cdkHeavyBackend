const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

/**
 * send message to sqs for handling.
 * @param {requestObject} requestObject {hex: string, nonce: string} 
 */
async function sendMessageSQS({ hex, nonce }){
  console.log("sendingSQS")
    var params = {
        MessageAttributes: {
        "Hex": {
        DataType: "String",
        StringValue: hex
        },
        "Nonce": {
        DataType: "String",
        StringValue: nonce
        }
    },
    MessageBody: JSON.stringify({
        hex: hex,
        nonce: nonce
    }),
    QueueUrl: "https://sqs.us-east-1.amazonaws.com/479990709135/HeavyBackendEventQueue"
    };

await sqs.sendMessage(params, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data.MessageId);
  }
}).promise();
}

async function deleteMessage(eventRecord){
  const params = {
    QueueUrl: "https://sqs.us-east-1.amazonaws.com/479990709135/HeavyBackendEventQueue",
    ReceiptHandle: eventRecord.receiptHandle
  }
  await sqs.deleteMessage(params, function(err, data){
    if (err) {
      console.log(err);
    } else {
      console.log(data);
    }
  }).promise();
}

module.exports = { sendMessageSQS, deleteMessage }