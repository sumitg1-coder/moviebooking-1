const db = require("../models");
const Movie = db.movies;

// Find all Movies
exports.findAllMovies = (req, res) => {
  const { 
    status, 
    title, 
    genres, 
    artists, 
    start_date, 
    end_date 
  } = req.query;
  
  let condition = {};
  
  if (status) {
    const statusLower = status.toLowerCase();
    if (statusLower === 'published') {
      condition.published = true;
    } else if (statusLower === 'released') {
      condition.released = true;
    }
  }
  
  // Title search with case-insensitive partial match
  if (title) {
    condition.title = { 
      $regex: new RegExp(title, 'i') 
    };
  }
  
  // Genres filtering
  if (genres) {
    const genreList = genres.split(',').map(genre => genre.trim());
    condition.genres = { 
      $elemMatch: { $in: genreList } 
    };
  }
  
  // Artists filtering
  if (artists) {
    const artistList = artists.split(',').map(artist => artist.trim());
    condition.artists = { 
      $elemMatch: { $in: artistList } 
    };
  }
  
  // Date range filtering
  if (start_date || end_date) {
    condition.release_date = {};
    
    if (start_date) {
      condition.release_date.$gte = start_date;
    }
    
    if (end_date) {
      condition.release_date.$lte = end_date;
    }
  }

  // Perform the query with additional options
  Movie.find(condition)
    .then(movies => {
      res.json({
        movies: movies,
        page: 1,
        limit: movies.length,
        total: movies.length
      });
    })
    .catch(err => {
      res.status(500).json({
        message: "Error retrieving movies",
        error: err.message
      });
    });
};

// Find a single Movie with complete details
exports.findOne = async (req, res) => {
  const id = req.params.id;
  const movieId = parseInt(id, 10);

  if (isNaN(movieId)) {
    return res.status(400).json({
      message: "Invalid movie ID format",
    });
  }

  try {
    // Fetch the movie
    const movie = await Movie.findOne({ movieid: movieId });
    if (!movie) {
      return res.status(404).json({
        message: `Movie not found with id ${id}`,
      });
    }

    // Explicitly ensure genres is an array and not undefined
    const genres = movie.genres && Array.isArray(movie.genres) 
      ? movie.genres 
      : [];

    // Create a new object with explicit genre handling
    const safeMovie = {
      ...movie.toObject(), // Use toObject() to convert Mongoose document to plain object
      genres: genres,
      critics_rating: movie.critic_rating,
      storyline: movie.story_line || "No storyline available"
    };

    res.json(safeMovie);
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving movie",
      error: err.message,
    });
  }
};

// Find shows for a specific movie
exports.findShows = (req, res) => {
  const id = req.params.id;
  const movieId = parseInt(id, 10);

  if (isNaN(movieId)) {
    return res.status(400).json({
      message: "Invalid movie ID format"
    });
  }

  Movie.findOne({ movieid: movieId })
    .then(movie => {
      if (!movie) {
        return res.status(404).json({
          message: `Movie not found with id ${id}`
        });
      }

      // Transform the shows into the expected format
      const shows = (movie.shows || []).map(show => ({
        theatre: {
          city: show.theatre?.city || "Unknown",
          name: show.theatre?.name || "Unknown"
        },
        language: show.language || "Unknown",
        show_timing: show.show_timing || "Unknown",
        unit_price: show.unit_price || 0,
        available_seats: parseInt(show.available_seats, 10) || 0 // Ensure seats are a number
      }));

      res.json(shows);
    })
    .catch(err => {
      res.status(500).json({
        message: "Error retrieving shows",
        error: err.message
      });
    });
};

// Create a new movie
exports.create = (req, res) => {
  const { title, movieid } = req.body;
  
  if (!title) {
    return res.status(400).json({ 
      message: "Movie title is required" 
    });
  }
  
  if (!movieid) {
    return res.status(400).json({ 
      message: "Movie ID is required" 
    });
  }

  const movie = new Movie({
    movieid: req.body.movieid,
    title: req.body.title,
    published: req.body.published || false,
    released: req.body.released || false,
    poster_url: req.body.poster_url || '',
    release_date: req.body.release_date || null,
    publish_date: req.body.publish_date || null,
    artists: req.body.artists || [],
    genres: Array.isArray(req.body.genres) ? req.body.genres : [],
    duration: req.body.duration || 0,
    critics_rating: req.body.critic_rating || 0,
    trailer_url: req.body.trailer_url || '',
    wiki_url: req.body.wiki_url || '',
    storyline: req.body.story_line || '',
    shows: req.body.shows || []
  });

  movie.save()
    .then(savedMovie => {
      res.status(201).json({ 
        message: "Movie created successfully", 
        movie: savedMovie 
      });
    })
    .catch(err => {
      res.status(500).json({
        message: "Error creating movie",
        error: err.message
      });
    });
};

// Update a movie by Id
exports.update = (req, res) => {
  const id = req.params.id;
  const movieId = parseInt(id, 10);
  
  if (isNaN(movieId)) {
    return res.status(400).json({ 
      message: "Invalid movie ID format" 
    });
  }

  if (!req.body) {
    return res.status(400).json({
      message: "Update data cannot be empty"
    });
  }

  if (req.body.genres && !Array.isArray(req.body.genres)) {
    req.body.genres = [];
  }

  Movie.findOneAndUpdate(
    { movieid: movieId }, 
    req.body, 
    { 
      new: true,
      runValidators: true
    }
  )
    .then(updatedMovie => {
      if (!updatedMovie) {
        return res.status(404).json({
          message: `Cannot update Movie with id=${id}. Movie not found.`
        });
      }
      
      res.json({ 
        message: "Movie updated successfully", 
        movie: updatedMovie 
      });
    })
    .catch(err => {
      res.status(500).json({
        message: "Error updating movie",
        error: err.message
      });
    });
};

// Delete a movie by Id
exports.delete = (req, res) => {
  const id = req.params.id;
  const movieId = parseInt(id, 10);
  
  if (isNaN(movieId)) {
    return res.status(400).json({ 
      message: "Invalid movie ID format" 
    });
  }

  Movie.findOneAndRemove({ movieid: movieId })
    .then(deletedMovie => {
      if (!deletedMovie) {
        return res.status(404).json({
          message: `Cannot delete Movie with id=${id}. Movie not found.`
        });
      }
      
      res.json({ 
        message: "Movie deleted successfully",
        movie: deletedMovie
      });
    })
    .catch(err => {
      res.status(500).json({
        message: "Could not delete movie",
        error: err.message
      });
    });
};