const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;

db.movies = require("./movie.model");
db.users = require("./user.model");
db.artists = require("./artist.model");
db.genres = require("./genre.model");

module.exports = db;