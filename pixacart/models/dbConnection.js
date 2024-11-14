const config = require("../config/config");
var mongoose = require("mongoose");
const connection = mongoose.connect(config.MONGODB_CONNECTION_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true, //mongodb://98.130.54.134:27017/EcomDB
});
mongoose.connection.on("connected", () => {
  console.log("connected to mongo");
});

mongoose.connection.on("error", (err) => {
  console.log("error connecting", err);
});

module.exports = connection;

require("./DatabaseModel");
