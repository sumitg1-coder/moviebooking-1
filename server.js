const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Configuration
const dbConfig = require("./config/db.config");

mongoose
  .connect(dbConfig.url) // Connect to MongoDB
  .then(() => {
    console.log("Successfully connected to the database");
  })
  .catch((err) => {
    console.error("Could not connect to the database. Exiting now...", err);
    process.exit(1);
  });

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  console.log("Query Params:", req.query);
  console.log("Body:", req.body);
  console.log("Headers:", req.headers);
  next();
});


// Default route (root path)
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Upgrad Movie booking application development." });
});

// Import Routes
const movieRoutes = require("./routes/movie.routes");
const artistRoutes = require("./routes/artist.routes");
const genreRoutes = require("./routes/genre.routes");
const userRoutes = require("./routes/user.routes");

// Use Routes
app.use("/api", movieRoutes);
app.use("/api", artistRoutes);
app.use("/api", genreRoutes);
app.use("/api", userRoutes);

app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(middleware.route.methods, middleware.route.path);
  }
});

// Start the Server
const PORT = 8085;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});