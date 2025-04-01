const db = require("../models");
const User = db.users;
const TokenGenerator = require('uuid-token-generator');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const axios = require("axios");

// SignUp - Create and Save a new User
exports.signUp = async (req, res) => {
  // Validate request
  if (!req.body.email_address || !req.body.password || !req.body.first_name || !req.body.last_name) {
    return res.status(400).send({
      message: "Email, password, first name, and last name are required!"
    });
  }

  try {
    // Find the highest userid in the system
    const highestUserDoc = await User.findOne().sort('-userid').exec();
    const nextUserId = highestUserDoc ? highestUserDoc.userid + 1 : 1;

    // Generate username if not provided
    const username = req.body.username || `${req.body.first_name}_${req.body.last_name}`;

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);

    // Create a User
    const user = new User({
      userid: nextUserId, // Assign the next available userid
      email: req.body.email_address,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      username: username,
      contact: req.body.mobile_number,
      password: hashedPassword,
      role: req.body.role || "user",
      isLoggedIn: false,
      uuid: "",
      accesstoken: "",
      coupens: req.body.coupens || [],
      bookingRequests: req.body.bookingRequests || []
    });

    // Save User in the database
    const data = await user.save();
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the User."
    });
  }
};

// User Authentication & Login
exports.login = (req, res) => {
  // Extract username and password from Basic Auth header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(400).send({ message: "Authentication header is required!" });
  }
  
  // Decode the Base64 credentials
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
  if (!username || !password) {
    return res.status(400).send({ message: "Username and password are required!" });
  }

  User.findOne({ username: username })
    .then(user => {
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).send({ message: "Invalid credentials" });
      }
      
      // Generate UUID and token with proper strength
      const userUuid = uuidv4();
      const tokenGen = new TokenGenerator(256, TokenGenerator.BASE62);
      const accesstoken = tokenGen.generate();
      
      User.findByIdAndUpdate(
        user._id, 
        { isLoggedIn: true, uuid: userUuid, accesstoken: accesstoken },
        { useFindAndModify: false, new: true }
      )
        .then(updatedUser => {
          // Set access token in response header and in the body
          res.header('access-token', accesstoken);
          
          res.send({
            id: updatedUser.uuid, // Send UUID as ID
            username: updatedUser.username,
            firstName: updatedUser.first_name,
            lastName: updatedUser.last_name,
            email: updatedUser.email,
            isLoggedIn: updatedUser.isLoggedIn,
            'access-token': accesstoken // Also include in response body for older browsers
          });
        })
        .catch(err => {
          res.status(500).send({ message: "Error updating user login status" });
        });
    })
    .catch(err => {
      res.status(500).send({ message: "Error finding user" });
    });
};

// Logout a user and invalidate their session
exports.logout = (req, res) => {
  const uuid = req.params.id;
  
  User.findOneAndUpdate(
    { uuid: uuid },
    { isLoggedIn: false, uuid: "", accesstoken: "" },
    { useFindAndModify: false }
  )
    .then(data => {
      if (!data) {
        res.status(404).send({ message: `User not found with uuid=${uuid}` });
      } else {
        res.send({ message: "User logged out successfully" });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Error logging out user" });
    });
};

// Retrieve all Users from the db
exports.findAll = (req, res) => {
  User.find()
    .then(users => {
      res.json({
        users: users || [],
        page: 1,
        limit: (users || []).length,
        total: (users || []).length
      });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving users."
      });
    });
};

// Find a single User.
exports.findOne = (req, res) => {
  const id = req.params.id;

  // Find a single User by ID, username, or UUID
  User.findOne({ $or: [
    // Try to match MongoDB _id (if it's a valid MongoDB ObjectId)
    ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : []),
    { userid: parseInt(id) || -1 },
    { username: id },
    { uuid: id }
  ]})
    .then(user => {
      if (!user)
        return res.status(404).send({ message: "User not found with id " + id });
      
      res.json({ 
        user: user || {},
        coupens: user.coupens || [],
        bookingRequests: user.bookingRequests || []
      });
    })
    .catch(err => {
      res.status(500).send({ message: "Error retrieving User with id=" + id });
    });
};

// Retrieve user information using authentication token
exports.getUserByToken = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).send({ message: "Authentication token is required!" });
  }
  
  User.findOne({ accesstoken: token })
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "User not found with provided token" });
      }
      
      res.send({
        id: user.uuid,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        isLoggedIn: user.isLoggedIn
      });
    })
    .catch(err => {
      res.status(500).send({ message: "Error retrieving User with token" });
    });
};

// Update a User by Id
exports.update = (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!"
    });
  }

  const id = req.params.id;

  User.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
    .then(data => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update User with id=${id}. Maybe User was not found!`
        });
      } else res.send({ message: "User was updated successfully." });
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating User with id=" + id
      });
    });
};

// Delete a User with the specified id
exports.delete = (req, res) => {
  const id = req.params.id;

  User.findByIdAndRemove(id)
    .then(data => {
      if (!data) {
        res.status(404).send({
          message: `Cannot delete User with id=${id}. Maybe User was not found!`
        });
      } else {
        res.send({
          message: "User was deleted successfully!"
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete User with id=" + id
      });
    });
};

// Get coupon code
exports.getCouponCode = (req, res) => {
  const userId = req.params.id;

  User.findById(userId)
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "User not found with id " + userId });
      }
      
      // Check if user is logged in
      if (!user.isLoggedIn) {
        return res.status(401).send({ message: "User must be logged in to get coupon" });
      }
      
      // Return available coupons for the user as an object with array
      res.json({
        coupens: user.coupens || [],
        page: 1,
        limit: (user.coupens || []).length,
        total: (user.coupens || []).length
      });
    })
    .catch(err => {
      res.status(500).send({ 
        message: "Error retrieving coupons for user with id=" + userId 
      });
    });
};

// Apply coupon code, mostly not being used, just created for testing purpose
exports.applyCoupon = (req, res) => {
  const couponCode = parseInt(req.query.code) || 0;
  const customerUuid = req.user.uuid;
  
  if (!couponCode) {
    return res.status(400).send({ message: "Coupon code is required" });
  }
  
  User.findOne({ uuid: customerUuid })
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }
      
      // Check if the user has any booking requests
      if (!user.bookingRequests || user.bookingRequests.length === 0) {
        return res.status(400).send({ 
          message: "No active booking found to apply coupon" 
        });
      }
      
      // Get the latest booking request
      const latestBooking = user.bookingRequests[user.bookingRequests.length - 1];
      
      // Check if this booking already has a coupon applied
      if (latestBooking.coupon_code) {
        return res.status(400).send({
          message: "A coupon has already been applied to this booking",
          coupon_code: latestBooking.coupon_code
        });
      }
      
      // Check if this coupon has been used for this show before
      const couponUsedForShow = user.bookingRequests.some(booking => 
        booking.show_id === latestBooking.show_id && 
        booking.coupon_code === couponCode
      );
      
      if (couponUsedForShow) {
        return res.status(400).send({
          message: "This coupon has already been used for this show"
        });
      }
      
      // Calculate the total price from the booking information or query parameter
      const totalPrice = parseInt(req.query.totalPrice) || 
                        (latestBooking.ticket_price * latestBooking.tickets.length) || 
                        1000;
      
      // Calculate bounds for the random discount within 10-50% range
      const minDiscount = Math.floor(totalPrice * 0.1); // 10% of total price
      const maxDiscount = Math.floor(totalPrice * 0.5); // 50% of total price
      
      // Generate a random discount within the specified range
      const discountValue = Math.floor(Math.random() * (maxDiscount - minDiscount + 1)) + minDiscount;
      
      // Check if the coupon already exists in user's coupens
      const existingCouponIndex = (user.coupens || []).findIndex(coupon => coupon.id === couponCode);
      
      if (existingCouponIndex === -1) {
        // Coupon doesn't exist, add it to the user's coupens array
        const newCoupon = {
          id: couponCode,
          discountValue: discountValue
        };
        
        const updatedCoupens = [...(user.coupens || []), newCoupon];
        
        // Update the booking to mark this coupon as used
        latestBooking.coupon_code = couponCode;
        
        // Save the updated booking information and coupens
        User.findByIdAndUpdate(
          user._id,
          { 
            bookingRequests: user.bookingRequests,
            coupens: updatedCoupens
          },
          { useFindAndModify: false }
        )
          .then(() => {
            res.send({
              valid: true,
              discountValue: discountValue,
              message: 'Coupon applied successfully'
            });
          })
          .catch(err => {
            res.status(500).send({ 
              message: "Error updating booking with coupon code" 
            });
          });
      } else {
        // Coupon already exists, use the existing discount value
        const existingDiscount = user.coupens[existingCouponIndex].discountValue;
        
        // Update the booking to mark this coupon as used
        latestBooking.coupon_code = couponCode;
        
        // Save the updated booking information
        User.findByIdAndUpdate(
          user._id,
          { bookingRequests: user.bookingRequests },
          { useFindAndModify: false }
        )
          .then(() => {
            res.send({
              valid: true,
              discountValue: existingDiscount,
              message: 'Existing coupon applied successfully'
            });
          })
          .catch(err => {
            res.status(500).send({ 
              message: "Error updating booking with coupon code" 
            });
          });
      }
    })
    .catch(err => {
      res.status(500).send({ 
        message: "Error processing coupon application" 
      });
    });
};

// BookShow
exports.bookShow = async (req, res) => {
  console.log("Incoming booking request:", req.body);

  const { customerUuid, bookingRequest } = req.body;

  // Validate request body
  if (!customerUuid || !bookingRequest || !bookingRequest.tickets) {
    return res.status(400).json({
      message: "Invalid request. 'customerUuid' and 'tickets' are required."
    });
  }

  try {
    // Find the user by UUID
    const user = await User.findOne({ uuid: customerUuid });
    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    // Generate a numeric reference number
    const referenceNumber = Math.floor(10000 + Math.random() * 90000); // 5-digit number

    // Create a minimal booking object with just the required fields
    const booking = {
      reference_number: referenceNumber,
      coupon_code: bookingRequest.coupon_code || null,
      show_id: 1000 + Math.floor(Math.random() * 10), // Generate a sample show_id between 1000-1009
      tickets: bookingRequest.tickets
    };

    // Initialize bookingRequests array if it doesn't exist
    if (!user.bookingRequests) {
      user.bookingRequests = [];
    }
    
    // Add the new booking to the user's bookingRequests array
    user.bookingRequests.push(booking);

    // Save the updated user document
    await User.findByIdAndUpdate(
      user._id,
      { bookingRequests: user.bookingRequests },
      { useFindAndModify: false, new: true }
    );

    // Respond with the booking confirmation
    res.status(201).json({
      reference_number: referenceNumber,
      message: "Booking confirmed successfully.",
      booking: booking
    });
  } catch (err) {
    console.error("Error processing booking:", err);
    res.status(500).json({
      message: "Error processing booking.",
      error: err.message
    });
  }
};

// Implement a session check endpoint
exports.checkSession = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).send({ 
      valid: false,
      message: "No authentication token provided" 
    });
  }
  
  User.findOne({ accesstoken: token })
    .then(user => {
      if (!user || !user.isLoggedIn) {
        return res.status(401).send({ 
          valid: false,
          message: "Invalid or expired session" 
        });
      }
      
      res.send({
        valid: true,
        userId: user.uuid,
        message: "Session is valid"
      });
    })
    .catch(err => {
      res.status(500).send({ 
        valid: false,
        message: "Error checking session" 
      });
    });
};

module.exports = exports;