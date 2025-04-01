const express = require("express");
const router = express.Router();
const artists = require("../controllers/artist.controller");

// Retrieve all Artists
// GET /artists
router.get("/artists", artists.findAllArtists);

// Create a new Artist
router.post("/artists", artists.create);

// Retrieve a single Artist with id
router.get("/artists/:id", artists.findOne);

// Update an Artist with id
router.put("/artists/:id", artists.update);

// Delete an Artist with id
router.delete("/artists/:id", artists.delete);

module.exports = router;