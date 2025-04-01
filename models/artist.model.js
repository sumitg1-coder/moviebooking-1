const mongoose = require("mongoose");

const ArtistSchema = new mongoose.Schema({
  artistid: { type: Number, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  wiki_url: { type: String },
  profile_url: { type: String },
  movies: { type: Array, default: [] }
});

module.exports = mongoose.model("Artist", ArtistSchema);