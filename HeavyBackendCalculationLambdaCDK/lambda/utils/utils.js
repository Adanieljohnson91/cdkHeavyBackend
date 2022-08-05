const { queryForHex } = require("../services/ddbService");

/**
 * check if job has already been finished
 * @param {*} job object with hex property <string>
 * @returns
 */
async function isJobStatusFinished(job) {
  let runJob = false;
  try {
    const result = await queryForHex(job.hex).then((data) => {
      if (data.Items != undefined) return data.Items[0];
    });

    if (result != undefined) {
      runJob = result.JobStatus == "finished";
    }
  } catch (err) {
    console.log(`query for job failed, assuming job is pending.`);
  }
  return runJob;
}

module.exports = { checkForFinishedJob: isJobStatusFinished };
