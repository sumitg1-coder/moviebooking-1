const mongoose = require("mongoose");

const MovieSchema = new mongoose.Schema({
  movieid: { type: Number, required: true },
  title: { type: String, required: true },
  published: { type: Boolean, default: false },
  released: { type: Boolean, default: false },
  poster_url: { type: String, default: '' },
  release_date: { type: String, default: '' },
  publish_date: { type: String, default: '' },
  artists: { type: Array, default: [] },
  genres: { 
    type: [String],
    default: []
  },
  duration: { type: Number, default: 0 },
  critic_rating: { type: Number, default: 0 },
  trailer_url: { type: String, default: '' },
  wiki_url: { type: String, default: '' },
  story_line: { type: String, default: '' },
  shows: { type: Array, default: [] }
});

module.exports = mongoose.model("Movie", MovieSchema);