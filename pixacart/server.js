require("./models/dbConnection");
const mongoose = require("mongoose");
const express = require("express");
var cookieParser = require("cookie-parser");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const routes = require("./config/route");
const config = require("./config/config");
const helper = require("./helpers/my_helper");
const UserModel = mongoose.model("users");
require("dotenv").config();
var app = express();

// Setting EJS as templating engine
app.use(express.static("public"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ limit: "5mb", extended: false }));
// for parsing multipart/form-data
//app.use(upload.array());
app.use(cookieParser());

app.use(
  session({
    key: config.sessID,
    secret: config.keys.secret,
    resave: true,
    saveUninitialized: false,
    cookie: {
      expires: 60000000,
    },
  })
);

// google oauth2 login

const passport = require("passport");
var userProfile;

app.use(passport.initialize());
app.use(passport.session());

app.get("/success", (req, res) => res.send(userProfile));
app.get("/error", (req, res) => res.send("error logging in"));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://98.130.54.134:3000/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, done) {
      console.log("Google Profile:", profile); // Log the profile object

      try {
        const email = profile.emails[0].value; // Safely access profile.emails
        let user = await UserModel.findOne({ email });

        if (user) {
          return done(null, user);
        } else {
          let newUser = new UserModel({
            fullname: profile.displayName,
            email: email,
            profile_image: profile.photos[0].value,
            role: 2,
            status: 1,
          });
          await newUser.save();
          return done(null, newUser);
        }
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// Routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/courierservicelogin" }),
  async function (req, res) {
    try {
      // The user profile is available as req.user
      const userProfile = req.user;

      if (!userProfile) {
        throw new Error("User profile is not available.");
      }

      // Extract user data
      const { email, displayName: name, profile_image } = userProfile;

      // Set session data
      req.session.user = {
        user_id: userProfile._id,
        email: email,
        role: userProfile.role,
        profile_image: profile_image,
        fullname: name,
        status: userProfile.status,
      };

      // Redirect based on role and additional checks
      let redirectUrl = "/dashboard";
      if (userProfile.role === 2 && !userProfile.address) {
        redirectUrl = "/profile"; // Redirect to profile page if the address is not set
      }

      res.redirect(redirectUrl);
    } catch (error) {
      console.error("OAuth login error:", error);
      res.redirect("/courierservicelogin");
    }
  }
);

app.use(async function (req, res, next) {
  res.locals.user = req.session.user;
  res.locals.webImages = await helper.getWebSetting("web_images");
  res.locals.webSetting = await helper.getWebSetting("webSetting");
  res.locals.config = config;

  next();
});

app.use("/", routes);

app.use((req, res, next) => {
  if (req.cookies[config.sessID] && !req.session.user) {
    res.clearCookie(config.sessID);
  }
  next();
});

app.get("*", function (req, res) {
  res.redirect("/");
  /*console.log('req start: ',req.secure, req.hostname, req.originalurl, app.get('port'), req.get('host') , req.originalUrl, req.protocol);
    if (req.protocol == 'http') {
      res.redirect('https://' +
      req.get('host') + req.originalUrl);
    }*/
});

app.listen(config.PORT, () => {
  console.log("Express server started at port : " + config.PORT);
});
