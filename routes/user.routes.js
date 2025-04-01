const express = require("express");
const router = express.Router();
const users = require("../controllers/user.controller");

// User signup
router.post("/auth/signup", users.signUp);

// User login
router.post("/auth/login", users.login);

// User logout
router.post("/auth/logout/:id", users.logout);

// Retrieve all Users
router.get("/users", users.findAll);

// Retrieve a single User with id
router.get("/users/:id", users.findOne);

// Get user by token
router.get("/auth/me", authenticate, users.getUserByToken);

// Update a User with id
router.put("/users/:id", users.update);

// Delete a User with id
router.delete("/users/:id", users.delete);

// Get coupon code for a user
router.get("/users/:id/coupons", users.getCouponCode);

// Apply coupon code
router.get("/auth/coupons", authenticate, users.applyCoupon);

// Book a show
router.post("/auth/bookings", authenticate, users.bookShow);

// Check session validity
router.get("/auth/session", users.checkSession);

// Authentication middleware for users
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: "Authentication token is required!" });
    }

    const token = authHeader.split(' ')[1];
    
    // Find user with this accesstoken
    const User = require("../models").users;
    User.findOne({ accesstoken: token })
        .then(user => {
            if (!user || !user.isLoggedIn) {
                return res.status(401).send({ message: "Invalid or expired token" });
            }
            
            // Add user info to request for use in controller
            req.user = user;
            next();
        })
        .catch(err => {
            return res.status(500).send({ message: "Error verifying token" });
        });
}

module.exports = router;