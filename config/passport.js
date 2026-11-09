const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

function initializePassport() {
    // 1. Local Authentication Strategy
    passport.use(new LocalStrategy(User.authenticate()));

    // 2. Google OAuth 2.0 Strategy
    const googleClientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : "";
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : "";
    const backendUrl = (process.env.BACKEND_URL || "http://localhost:8080").replace(/\/+$/, "");
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${backendUrl}/api/auth/google/callback`;

    if (googleClientId && googleClientSecret) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: googleClientId,
                    clientSecret: googleClientSecret,
                    callbackURL: callbackURL,
                    passReqToCallback: true,
                },
                async (req, accessToken, refreshToken, profile, done) => {
                    try {
                        const email =
                            profile.emails && profile.emails[0]
                                ? profile.emails[0].value.toLowerCase().trim()
                                : null;

                        if (!email) {
                            return done(new Error("No email address provided by Google profile."));
                        }

                        const avatar =
                            profile.photos && profile.photos[0] ? profile.photos[0].value : "";
                        const displayName =
                            profile.displayName ||
                            `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() ||
                            "Google User";
                        const sessionRole =
                            req.session && req.session.oauthRole === "recruiter"
                                ? "recruiter"
                                : "job_seeker";
                        if (req.session && req.session.oauthRole) {
                            delete req.session.oauthRole;
                        }

                        // A. Check if user with this googleId already exists
                        let user = await User.findOne({ googleId: profile.id });
                        if (user) {
                            if (user.isActive === false) {
                                return done(null, false, { message: "Your account has been deactivated. Please contact support." });
                            }
                            if (!user.avatarUrl && avatar) {
                                user.avatarUrl = avatar;
                                await user.save();
                            }
                            return done(null, user);
                        }

                        // B. Check if existing user with matching email exists (link Google to existing account)
                        user = await User.findOne({ email });
                        if (user) {
                            if (user.isActive === false) {
                                return done(null, false, { message: "Your account has been deactivated. Please contact support." });
                            }
                            user.googleId = profile.id;
                            if (!user.avatarUrl && avatar) {
                                user.avatarUrl = avatar;
                            }
                            await user.save();
                            return done(null, user);
                        }

                        // C. New user signup via Google
                        user = new User({
                            username: email,
                            email,
                            fullName: displayName,
                            googleId: profile.id,
                            role: sessionRole,
                            avatarUrl: avatar,
                            authProvider: "google",
                        });

                        await user.save();
                        return done(null, user);
                    } catch (err) {
                        return done(err);
                    }
                }
            )
        );
        console.log(`[Google OAuth] Configured successfully with Callback URL: ${callbackURL}`);
    } else {
        console.log("[Google OAuth] Credentials not configured in .env (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).");
    }

    // 3. Unified User Session Serialization (supports both Local and Google OAuth users)
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
}

module.exports = initializePassport;
