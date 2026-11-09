
module.exports = (req, res, next) => {
    if (!req.user) {
        req.flash("error", "Please log in first.");
        return res.redirect("/login");
    }

    if (req.user.role !== "recruiter") {
        req.flash("error", "Recruiter access required.");
        return res.redirect("/");
    }

    next();
};
