const express = require("express");
const router = express.Router();
const movies = require("../controllers/movie.controller");

// Retrieve all Movies with optional filters
// GET /movies
// GET /movies?status=PUBLISHED
// GET /movies?status=RELEASED
// GET /movies?status=RELEASED&title={title}&genres={genres}&artists={artists}&start_date={startdate}&end_date={enddate}
router.get("/movies", movies.findAllMovies);

// Retrieve a single Movie with id
// GET /movies/{movieId}
router.get("/movies/:id", movies.findOne);

// Retrieve shows for a specific movie
// GET /movies/{movieId}/shows
router.get("/movies/:id/shows", movies.findShows);

// Create a new Movie
router.post("/movies", movies.create);

// Update a Movie with id
router.put("/movies/:id", movies.update);

// Delete a Movie with id
router.delete("/movies/:id", movies.delete);

module.exports = router;