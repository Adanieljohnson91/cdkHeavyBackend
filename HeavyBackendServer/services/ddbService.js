// Load the AWS SDK for Node.js
var AWS = require("aws-sdk");
// Set the region
AWS.config.update({ region: "us-east-1" });

// Create DynamoDB document client

const getDoc = async (hex) => {
  var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

  var params = {
    ExpressionAttributeValues: {
        ':h' : hex
    },
    FilterExpression: 'Hex = :h',
    TableName: "CalclationHashTable"
  };

  return await docClient.scan(params).promise().then(res => res);
};

module.exports = getDoc
