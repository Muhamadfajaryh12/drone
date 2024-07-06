const express = require("express");
const router = express.Router();

module.exports = function (connection) {
  router.get("/", function (req, res, next) {
    res.render("index", { title: "Express" });
  });

  router.get("/location", function (req, res) {
    connection.query("SELECT * FROM location", (err, rows) => {
      if (err) {
        console.error("Error querying database: " + err.stack);
        res.status(500).send("Error querying database.");
        return;
      }
      res.send(rows);
    });
  });

  router.put("/location/:id", function (req, res, next) {
    const id = req.params.id;
    const lat = req.body.lat;
    const long = req.body.long;

    connection.query(
      "UPDATE location SET latitude = ?, longtitude = ? WHERE id = ?",
      [lat, long, id],
      (err, result) => {
        if (err) {
          console.error("Error updating location: " + err.stack);
          res.status(500).send("Error updating location.");
          return;
        }
        res.send(`Location with ID ${id} updated.`);
      }
    );
  });

  return router;
};
