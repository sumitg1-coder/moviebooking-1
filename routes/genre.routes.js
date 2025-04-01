const express = require("express");
const router = express.Router();
const genres = require("../controllers/genre.controller");

// Retrieve all Genres
// GET /genres
router.get("/genres", genres.findAllGenres);

// Create a new Genre
router.post("/genres", genres.create);

// Retrieve a single Genre with id
router.get("/genres/:id", genres.findOne);

// Update a Genre with id
router.put("/genres/:id", genres.update);

// Delete a Genre with id
router.delete("/genres/:id", genres.delete);

module.exports = router;