const db = require("../models");
const Genre = db.genres;

// Find all Genres
exports.findAllGenres = (req, res) => {
  const { search } = req.query;
  
  let condition = {};
  
  if (search) {
    condition.genre = { 
      $regex: new RegExp(search, 'i') 
    };
  }

  Genre.find(condition)
    .then(genres => {
      res.json({genres: genres});
    })
    .catch(err => {
      res.status(500).json({
        message: "Error retrieving genres",
        error: err.message
      });
    });
};

// Create a new Genre
exports.create = (req, res) => {
  const { genre, genreid } = req.body;
  
  if (!genre) {
    return res.status(400).json({ 
      message: "Genre name is required" 
    });
  }
  
  if (!genreid) {
    return res.status(400).json({ 
      message: "Genre ID is required" 
    });
  }

  const newGenre = new Genre({
    genreid: genreid,
    genre: genre
  });

  newGenre.save()
    .then(savedGenre => {
      res.status(201).json({ 
        message: "Genre created successfully", 
        genre: savedGenre 
      });
    })
    .catch(err => {
      res.status(500).json({
        message: "Error creating genre",
        error: err.message
      });
    });
};

// Find a single Genre by Id
exports.findOne = (req, res) => {
  const id = req.params.id;
  const genreId = parseInt(id, 10);
  
  if (isNaN(genreId)) {
    return res.status(400).json({ 
      message: "Invalid genre ID format" 
    });
  }
  
  Genre.findOne({ genreid: genreId })
    .then(genre => {
      if (!genre) {
        return res.status(404).json({ 
          message: `Genre not found with id ${id}` 
        });
      }
      
      res.json({genre: genre || {}}); 
    })
    .catch(err => {
      res.status(500).json({
        message: "Error retrieving genre",
        error: err.message
      });
    });
};

// Update a Genre by Id
exports.update = (req, res) => {
  const id = req.params.id;
  const genreId = parseInt(id, 10);
  
  if (isNaN(genreId)) {
    return res.status(400).json({ 
      message: "Invalid genre ID format" 
    });
  }

  if (!req.body) {
    return res.status(400).json({
      message: "Update data cannot be empty"
    });
  }

  Genre.findOneAndUpdate(
    { genreid: genreId }, 
    req.body, 
    { 
      new: true,
      runValidators: true
    }
  )
    .then(updatedGenre => {
      if (!updatedGenre) {
        return res.status(404).json({
          message: `Cannot update Genre with id=${id}. Genre not found.`
        });
      }
      
      res.json({ 
        message: "Genre updated successfully", 
        genre: updatedGenre 
      });
    })
    .catch(err => {
      res.status(500).json({
        message: "Error updating genre",
        error: err.message
      });
    });
};

// Delete a Genre by Id
exports.delete = (req, res) => {
  const id = req.params.id;
  const genreId = parseInt(id, 10);
  
  if (isNaN(genreId)) {
    return res.status(400).json({ 
      message: "Invalid genre ID format" 
    });
  }

  Genre.findOneAndRemove({ genreid: genreId })
    .then(deletedGenre => {
      if (!deletedGenre) {
        return res.status(404).json({
          message: `Cannot delete Genre with id=${id}. Genre not found.`
        });
      }
      
      res.json({ 
        message: "Genre deleted successfully",
        genre: deletedGenre
      });
    })
    .catch(err => {
      res.status(500).json({
        message: "Could not delete genre",
        error: err.message
      });
    });
};