var express = require("express");
const getDoc = require("../services/ddbService");
const sentRequest = require("../services/sqsService");
var router = express.Router();



router.post("/", async function (request, res, next) {
  const docs = await getDoc(request.body.hex);
  console.log("docs: ", docs);
  if (docs.length > 0 && docs[0].JobStatus == "finished") {
    console.log("request is fullfilled");
    res.status(200).json({ message: docs });
  } else if (docs.length > 0) {
    console.log(`request pending`);
    res.status(202).json({ message: "pending" });
  } else {
    console.log("sending request");
    const messageId = await sentRequest({
      hex: request.body.hex,
      nonce: "0",
    });
    res.status(200).json({ message: messageId });
  }
});

router.get("/:request", async function (request, res, next) {
  const docs = await getDoc(request.params.request);
  if (docs.Count > 0) {
    console.log(docs)
    if (docs.Items[0].JobStatus == "finished") {
      console.log("finished request, sending result to client")
      res.status(200).json({ message: docs.Items[0] });
    } else {
      res.status(204);
    }
  } else {
    console.log(docs);
    res.send(204);
  }
});



module.exports = router;
