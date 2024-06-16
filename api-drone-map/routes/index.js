var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.post("/location", function (req, res, next) {
  const lat = req.body.lat;
  const long = req.body.long;

  res.send(`Latitude: ${lat}, Longitude: ${long}`);
});

module.exports = router;
