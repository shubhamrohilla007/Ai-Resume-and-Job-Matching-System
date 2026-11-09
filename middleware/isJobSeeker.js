module.exports = (req, res, next) => {

    if (req.user.role !== "job_seeker") {

        req.flash("error", "Access Denied.");

        return res.redirect("/");
    }

    next();
};