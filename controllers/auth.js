
const User = require("../models/User");

// Render Signup Page
module.exports.renderSignupForm = (req, res) => {
    res.render("auth/signup");
};

// Register New User
module.exports.signup = async (req, res, next) => {
    try {
        const { fullName, email, password } = req.body;

        if (
            typeof fullName !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !fullName.trim() ||
            !email.trim() ||
            !password
        ) {
            req.flash("error", "Please fill in all required fields.");
            return res.redirect("/signup");
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Public signup must never create an admin account.
        // Recruiter registration is allowed if requested explicitly.
        const requestedRole =
            req.body.role === "recruiter"
                ? "recruiter"
                : "job_seeker";

        const newUser = new User({
            username: normalizedEmail,
            email: normalizedEmail,
            fullName: fullName.trim(),
            role: requestedRole,
        });

        const registeredUser = await User.register(
            newUser,
            password
        );

        req.login(registeredUser, (err) => {
            if (err) return next(err);

            req.flash("success", "Welcome to AI Resume System!");

            if (registeredUser.role === "recruiter") {
                return res.redirect("/dashboard/recruiter");
            }

            return res.redirect("/dashboard/jobseeker");
        });
    } catch (err) {
        console.error("Signup error:", err);

        req.flash(
            "error",
            err.name === "UserExistsError"
                ? "An account with this email already exists."
                : "Unable to create your account. Please try again."
        );

        return res.redirect("/signup");
    }
};

// Render Login Page
module.exports.renderLoginForm = (req, res) => {
    res.render("auth/login");
};

// Login Success
module.exports.login = (req, res) => {
    req.flash(
        "success",
        `Welcome Back, ${req.user.fullName}!`
    );

    switch (req.user.role) {
        case "job_seeker":
            return res.redirect("/dashboard/jobseeker");

        case "recruiter":
            return res.redirect("/dashboard/recruiter");

        case "admin":
            return res.redirect("/dashboard/admin");

        default:
            return res.redirect("/");
    }
};

// Logout
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);

        req.flash("success", "Logged Out Successfully!");
        return res.redirect("/login");
    });
};
