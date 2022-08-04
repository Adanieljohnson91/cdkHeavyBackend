// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-east-1'});

// Create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const sentRequest = async ({ hex, nonce }) => {
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

const res = await sqs.sendMessage(params, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data.MessageId);
  }
}).promise();
return res.MessageId;
}

module.exports = sentRequest