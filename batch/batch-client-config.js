const Aws = require('@aws-sdk/client-batch');
const dotenv = require('dotenv');

dotenv.config();

const batchConfig = {
  region: 'us-east-1',
  apiVersion: '2016-08-10',
  credentials: {
    accessKeyId: '###',
    secretAccessKey: '###',
  }
};

const AwsBatch = new Aws.Batch(batchConfig);

module.exports = AwsBatch;