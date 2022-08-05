const HashCalculationOrchestrator = require("./objects/HashCalculationOrchestrator");
const { queryForHex } = require("./services/ddbService");
const { deleteMessage } = require("./services/sqsService");
const { checkForFinishedJob } = require("./utils/utils");

/**
 *
 * @param {*} event SQS Event, contains records with hex values for lower hash calculation
 * @returns {*} statusObject -- if lambda completes execution it will return status object.
 *
 * Calculation Handler is a function that handler hex calculation request messages from SQS
 * These messages will go through an iterative process to find the first hash with a lower
 * value than the original hex input. It will iterate 1000 times before either being sent
 * back to the queue for future processing, marked as finished in our database, or marked
 * as a failure if we reach overflow.
 */
exports.handler = async function (event) {
  console.log("Records: ", event.Records);

  let eventRecords = event.Records.map((record) => {
    let res = JSON.parse(record.body);
    res.receiptHandle = record.receiptHandle;
    console.log("MESSAGE RES ", res);
    return res;
  });

  // TODO Check for finished job prior to evaluating.
  for (const job of eventRecords) {
    try {
      let calculationJob = new HashCalculationOrchestrator(job.hex, job.nonce);
      
      // check if job has already has a successful completion. if not find hash
      if (!(await checkForFinishedJob(job))) {
        calculationJob.findHash();
        await calculationJob.handleResults();
      }

      // delete sqs message from queue.
      await deleteMessage(job);
    } catch (err) {
      console.log(`[ERROR]failed to execute calculationJob run!: ${err}`);
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/json" },
    body: JSON.stringify({ message: `Heavybackend run complete` }),
  };
};
