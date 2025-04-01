const db = require("../models");
const Artist = db.artists;

// Find all Artists
exports.findAllArtists = (req, res) => {
  const { search, name } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  
  let condition = {};
  
  if (search) {
    condition.$or = [
      { first_name: { $regex: new RegExp(search, 'i') } },
      { last_name: { $regex: new RegExp(search, 'i') } }
    ];
  }
  
  if (name) {
    const [firstName, lastName] = name.split(' ');
    if (firstName) condition.first_name = { $regex: new RegExp(firstName, 'i') };
    if (lastName) condition.last_name = { $regex: new RegExp(lastName, 'i') };
  }

  Promise.all([
    Artist.find(condition).skip(skip).limit(limit),
    Artist.countDocuments(condition)
  ])
  .then(([artists, total]) => {
    res.json(artists);
  })
  .catch(err => {
    res.status(500).json({
      message: "Error retrieving artists",
      error: err.message
    });
  });
};

// Create a new Artist
exports.create = (req, res) => {
  const { first_name, last_name, artistid } = req.body;
  
  if (!first_name) {
    return res.status(400).json({ 
      message: "First name is required" 
    });
  }
  
  if (!last_name) {
    return res.status(400).json({ 
      message: "Last name is required" 
    });
  }
  
  if (!artistid) {
    return res.status(400).json({ 
      message: "Artist ID is required" 
    });
  }

  const newArtist = new Artist({
    artistid: artistid,
    first_name: first_name,
    last_name: last_name,
    wiki_url: req.body.wiki_url || '',
    profile_url: req.body.profile_url || '',
    movies: req.body.movies || []
  });

  newArtist.save()
    .then(savedArtist => {
      res.status(201).json({ 
        message: "Artist created successfully", 
        artist: savedArtist 
      });
    })
    .catch(err => {
      res.status(500).json({
        message: "Error creating artist",
        error: err.message
      });
    });
};

// Find a single Artist by Id
exports.findOne = (req, res) => {
  const id = req.params.id;
  const artistId = parseInt(id, 10);
  
  if (isNaN(artistId)) {
    return res.status(400).json({ 
      message: "Invalid artist ID format" 
    });
  }
  
  Artist.findOne({ artistid: artistId })
    .then(artist => {
      if (!artist) {
        return res.status(404).json({ 
          message: `Artist not found with id ${id}` 
        });
      }
      
      res.json({artist: artist}); 
    })
    .catch(err => {
      res.status(500).json({
        message: "Error retrieving artist",
        error: err.message
      });
    });
};

// Update an Artist by Id
exports.update = (req, res) => {
  const id = req.params.id;
  const artistId = parseInt(id, 10);
  
  if (isNaN(artistId)) {
    return res.status(400).json({ 
      message: "Invalid artist ID format" 
    });
  }

  if (!req.body) {
    return res.status(400).json({
      message: "Update data cannot be empty"
    });
  }

  Artist.findOneAndUpdate(
    { artistid: artistId }, 
    req.body, 
    { 
      new: true,
      runValidators: true
    }
  )
    .then(updatedArtist => {
      if (!updatedArtist) {
        return res.status(404).json({
          message: `Cannot update Artist with id=${id}. Artist not found.`
        });
      }
      
      res.json({ 
        message: "Artist updated successfully", 
        artist: updatedArtist 
      });
    })
    .catch(err => {
      res.status(500).json({
        message: "Error updating artist",
        error: err.message
      });
    });
};

// Delete an Artist by Id
exports.delete = (req, res) => {
  const id = req.params.id;
  const artistId = parseInt(id, 10);
  
  if (isNaN(artistId)) {
    return res.status(400).json({ 
      message: "Invalid artist ID format" 
    });
  }

  Artist.findOneAndRemove({ artistid: artistId })
    .then(deletedArtist => {
      if (!deletedArtist) {
        return res.status(404).json({
          message: `Cannot delete Artist with id=${id}. Artist not found.`
        });
      }
      
      res.json({ 
        message: "Artist deleted successfully",
        artist: deletedArtist
      });
    })
    .catch(err => {
      res.status(500).json({
        message: "Could not delete artist",
        error: err.message
      });
    });
};