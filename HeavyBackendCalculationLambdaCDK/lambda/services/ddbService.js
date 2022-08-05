const AWS = require("aws-sdk");
const ethers = require("ethers");

const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "CalclationHashTable";

/**
 * DynamoDB service to handle adding and updating hex calculation request items
 * methods:
 * addNewItemToHexStore: main method of class, handles logic for adding, updating, or ignoring request \
 * queryForHex: search for hex in db \
 * isNeedToUpdate: compare nonce to check for update \
 * updateItemHexStore: perform update based on job status
 */

/**
 * add or update current job depending on current status and nonce in table
 * if nonce is greater than previous nonce function will update the table
 * if nonce is less than previous nonce no update will occure
 * if item is not in db, item will be added
 * @param {*} hex: 256-bit hexadecimal string [0-9][a-f][32]
 * @param {*} hash: hexString 0x<hexadecimal value
 * @param {*} nonce: number string
 * @param {*} jobStatus: string
 */
async function addNewItemToHexStore(hex, hash, nonce, jobStatus) {
  console.log(
    `adding item to store. originalhex:${hex} newHash:${hash} nonce:${nonce} jobstatus: ${jobStatus}`
  );
  let params = {
    TableName: TABLE_NAME,
    Item: {
      Hex: hex,
      ResultHash: hash,
      Nonce: nonce,
      JobStatus: jobStatus,
    },
  };
  const itemQueryResponse = await queryForHex(hex);
  if (itemQueryResponse.Count > 0) {
    console.log(`request found in ddb table: ${hex} Nonce ${nonce}`);
    const prevNonce = await itemQueryResponse.Items[0].Nonce;
    if (isNeedToUpdate(nonce, prevNonce)) {
      console.log("...updating");
      await updateItemHexStore(hex, hash, nonce, jobStatus);
    }
  } else {
    try {
      console.log("new item, adding to ddb");
      await docClient
        .put(params, function (err, data) {
          if (err) {
            console.log(err);
          }
          if (data) {
            console.log(data);
          }
        })
        .promise();
    } catch (err) {
      console.log(`ERROR ADDING ITEM TO HEXTABLE!\n${err.message}`);
    }
  }
}

/**
 * getItemInHexStore is a method to check for the presence of an already
 * persisted hex object.
 */
async function queryForHex(hex) {
  console.log("checking for hex in table");
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "Hex = :hex",
    ExpressionAttributeValues: {
      ":hex": hex,
    },
  };
  return await docClient.query(params).promise();
}

/**
 * check if nonce is greater than previous nonce
 * @param {*} nonce: string | number
 * @param {*} prevNonce: string | number
 * @returns
 */
async function isNeedToUpdate(nonce, prevNonce) {
  let currentNonce = ethers.BigNumber.from(nonce);
  let previousNonce = ethers.BigNumber.from(prevNonce);
  return currentNonce.gt(previousNonce);
}

/**
 * update item in db, will check to see if the status is still
 * pending. If job status of item in db is finished update will
 * fail.
 * @param {*} hex: 256-bit hexadecimal string [0-9][a-f][32]
 * @param {*} hash: hexString 0x<hexadecimal value
 * @param {*} nonce: number string
 * @param {*} jobStatus: string
 * @returns
 */
async function updateItemHexStore(hex, hash, nonce, jobStatus) {
  console.log(`updating hex`);
  const params = {
    TableName: TABLE_NAME,
    Key: { Hex: hex },
    UpdateExpression:
      "set Nonce = :CURRENT_NONCE, JobStatus = :s, ResultHash = :h",
    ConditionExpression: "contains(JobStatus, :f)",
    ExpressionAttributeValues: {
      ":h": hash,
      ":s": jobStatus,
      ":CURRENT_NONCE": nonce.toString(),
      ":f": "pending",
    },
  };
  return await docClient
    .update(params)
    .promise()
    .catch((err) => console.log(err));
}

module.exports = { addNewItemToHexStore, queryForHex }