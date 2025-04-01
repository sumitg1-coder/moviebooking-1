const mongoose = require("mongoose");

const GenreSchema = new mongoose.Schema({
  genreid: { type: Number, required: true },
  genre: { type: String, required: true }
});

module.exports = mongoose.model("Genre", GenreSchema);