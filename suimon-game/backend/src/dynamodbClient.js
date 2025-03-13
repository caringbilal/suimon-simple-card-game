const AWS = require('aws-sdk');

// Configure the AWS region
AWS.config.update({
    region: 'us-west-2',  // Replace with your AWS region
});

// Create DynamoDB service object
const dynamodb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

module.exports = dynamodb;