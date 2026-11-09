const express = require("express");
const passport = require("passport");

const router = express.Router();

const authController = require("../controllers/auth");

// Signup
router
    .route("/signup")
    .get(authController.renderSignupForm)
    .post(authController.signup);

// Login
router
    .route("/login")
    .get(authController.renderLoginForm)
    .post(
        passport.authenticate("local", {
            failureRedirect: "/login",
            failureFlash: true,
        }),
        authController.login
    );

// Logout
router.get("/logout", authController.logout);

module.exports = router;