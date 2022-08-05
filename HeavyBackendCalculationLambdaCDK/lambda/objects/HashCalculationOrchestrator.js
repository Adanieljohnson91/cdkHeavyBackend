const ethers = require("ethers");
const keccak256 = require("keccak256");

const { addNewItemToHexStore } = require("../services/ddbService");
const { sendMessageSQS } = require("../services/sqsService");

/**
 * HashCalculationOrchestrator handles lower hash identification logic
 */
module.exports = class HashCalculationOrchestrator {
  /**
   *
   * @param {*} originalHex :string hexadecimal value i.e [0-9][a-f]
   * @param {*} nonce :string | number 1-2^64
   */
  constructor(originalHex, nonce) {
    this.originalHex = ethers.BigNumber.from(Buffer.from(originalHex, "hex"));
    this.currentHash = ethers.BigNumber.from(Buffer.from(originalHex, "hex"));
    this.nonce = ethers.BigNumber.from(nonce);

    this.limit = ethers.BigNumber.from(nonce).add(1000000);
    this.MAX_SAFE_BIG_NUMBER = ethers.BigNumber.from("18446744073709551616");
    this.log = console.log;
  }

  /**
   * Locate Lower Hash
   */
  findHash() {
    this.log(`searching lower hash for: ${this.originalHex}`);
    const intervalId = setInterval(() => {
      this.log(
        `searching original:${this.originalHex} current: ${this.currentHash} nonce: ${this.nonce}`
      );
    }, 5000);
    while (
      this.originalHex.lte(this.currentHash) &&
      this.nonce.lt(this.limit) &&
      this.nonce.lt(this.MAX_SAFE_BIG_NUMBER)
    ) {
      this.currentHash = ethers.BigNumber.from(
        keccak256(this.originalHex.add(this.nonce).toHexString())
      );
      this.compareHexAndIncrement();
    }
    clearInterval(intervalId);
    this.log(
      `finished search: original:${this.originalHex} current: ${this.currentHash} nonce: ${this.nonce}`
    );
  }

  async addPendingItemToHexStore() {
    this.log("lower hash NOT FOUND, updating/adding item to table");
    this.describe();
    await addNewItemToHexStore(
      this.hexToString(),
      this.currentHash.toHexString(),
      this.nonce.toString(),
      "pending"
    );

    this.log("continuing search, sending message to sqs");
    await sendMessageSQS({
      hex: this.hexToString(),
      nonce: this.nonce.toString(),
    });
  }
  
  async addFinishedItemToHexStore() {
    this.log("lower hash FOUND, updating/adding item to table");
    this.describe();
    await addNewItemToHexStore(
      this.hexToString(),
      this.currentHash.toHexString(),
      this.nonce.toString(),
      "finished"
    );
  }

  async addFailedItemToHexStore() {
    this.log("nonce out of range, search failed. updating item in table");
    this.describe();
    await addNewItemToHexStore(
      this.hexToString(),
      this.currentHash.toHexString(),
      this.nonce.toString(),
      "failure"
    );
  }

  /**
   * Should be ran prior to findHash. \
   * method will handle hash calculation based on results
   */
  async handleResults() {
    this.log(`evaluating...`);
    if (
      this.originalHex.lte(this.currentHash) &&
      this.nonce.lt(this.MAX_SAFE_BIG_NUMBER)
    ) {
      await this.addPendingItemToHexStore();
    } else if (this.originalHex.gt(this.currentHash)) {
      await this.addFinishedItemToHexStore();
    } else {
      await this.addFailedItemToHexStore();
    }
  }

  compareHexAndIncrement() {
    if (this.originalHex.lte(this.currentHash)) {
      this.incNonce();
    }
  }

  incNonce() {
    this.nonce = this.nonce.add(1);
  }

  hexToString() {
    const cleanedHexString = this.originalHex.toHexString().slice(2);
    return cleanedHexString;
  }

  /**
   * Logs Desciption of job.
   */
  describe() {
    console.log(`
      Hex ${this.hexToString()}\n
      Hash ${this.currentHash.toHexString()}\n
      Nonce ${this.nonce}\n
      `);
  }
};
