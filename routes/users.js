var express = require("express");
const bodyParser = require("body-parser");
var User = require("../models/user");
var passport = require("passport");
var authenticate = require("../authenticate");
const cors = require("./cors");
const { getMaxListeners } = require("../models/user");
const crypto = require("crypto");
const user = require("../models/user");

var router = express.Router();
router.use(bodyParser.json());


/* GET users listing. */
router.options("*", cors.corsWithOptions, (req, res) => {
  res.sendStatus(200);
});
router.get("/", cors.corsWithOptions, function(req, res, next) {
  User.find({})
    .then(
      (users) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(users);
      },
      (err) => next(err)
    )
    .catch((err) => next(err));
});

router.put("/:userId", cors.corsWithOptions, function(req, res, next) {
  User.findByIdAndUpdate(
    req.params.userId,
    {
      $set: req.body,
    },
    { new: true }
  )
    .then(
      (user) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(user);
      },
      (err) => next(err)
    )
    .catch((err) => next(err));
});

router.post("/signup", cors.corsWithOptions, (req, res, next) => {
  User.register(
    new User({ username: req.body.username }),
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(req.body.username);
        res.statusCode = 501;
        res.setHeader("Content-Type", "application/json");
        res.json({ err: err });
      } else {
        if (req.body.firstname) user.firstname = req.body.firstname;
        if (req.body.lastname) user.lastname = req.body.lastname;
        if (req.body.phoneno) user.phoneno = req.body.phoneno;
        if (req.body.admin) user.admin = req.body.admin;
        user.save((err, user) => {
          if (err) {
            res.statusCode = 504;
            res.setHeader("Content-Type", "application/json");
            res.json({ err: err });
            return;
          }
          passport.authenticate("local")(req, res, () => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({
              success: true,
              status: "Registration Successful",
              user: user,
            });
          });
        });
      }
    }
  );
});

router.post("/login", cors.corsWithOptions, (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.json({ success: false, status: "Login Unsuccessful", err: info });
    }
    req.logIn(user, (err) => {
      if (err) {
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        res.json({
          success: false,
          status: "Login Unsuccessful",
          err: "Could not log in user!",
        });
      }
      var token = authenticate.getToken({ _id: req.user._id });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({
        success: true,
        token: token,
        status: "You are successfully logged in!",
      });
    });
  })(req, res, next);
});

router.get("/logout", cors.corsWithOptions, (req, res) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie("session-id");
    res.redirect("/");
  } else {
    var err = new Error("You are not logged in");
    err.status = 403;
    next(err);
  }
});

router.get(
  "/facebook/token",
  passport.authenticate("facebook-token"),
  (req, res) => {
    if (req.user) {
      var token = authenticate.getToken({ _id: req.user._id });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({
        success: true,
        token: token,
        status: "You are successfully logged in!",
      });
    }
  }
);

router.get("/checkJWTToken", cors.corsWithOptions, (req, res) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "Application/json");
      return res.json({ status: "JWT invalid!", success: false, err: info });
    } else {
      res.statusCode = 200;
      res.setHeader("Content-Type", "Application/json");
      return res.json({ status: "JWT valid!", success: true, user: user });
    }
  })(res, res);
});

router.post("/changepassword", cors.corsWithOptions, function(req, res) {
  User.findOne({ _id: req.body.userId }, (err, user) => {
    // Check if error connecting
    if (err) {
      res.json({ success: false, message: err }); // Return error
    } else {
      // Check if user was found in database
      if (!user) {
        res.json({ success: false, message: "User not found" }); // Return error, user was not found in db
      } else {
        user.changePassword(
          req.body.oldPassword,
          req.body.newPassword,
          function(err) {
            if (err) {
              if (err.name === "IncorrectPasswordError") {
                res.json({ success: false, message: "Incorrect password" }); // Return error
              } else {
                res.json({
                  success: false,
                  message:
                    "Something went wrong!! Please try again after sometimes.",
                });
              }
            } else {
              res.json({
                success: true,
                message: "Your password has been changed successfully",
              });
            }
          }
        );
      }
    }
  });
});

// router.post("/resetpassword", cors.corsWithOptions, function(req, res) {
//   console.log(req.body);
//   User.findOne({ username: req.body.userName }, (err, user) => {
//     console.log(user);
//     if (!user) {
//       res.json({ success: false, message: "User not found" }); // Return error, user was not found in db
//     } else {
//       console.log("idhar bhi aa gya");
//       user.setPassword(req.body.newPassword, function(err, user) {
//         if (err) {
//           console.log(" idhar aa gya " + err);
//           res.json({
//             success: false,
//             message: "Password could not be saved. Please try again!",
//           });
//         } else {
//           console.log("Yipeeee Password change");
//           res.json({
//             success: true,
//             message: "Your new password has been saved successfully",
//           });
//         }
//       });
//     }
//   });
// });

router.post("/resetpassword", (req, res) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
    }
    const token = buffer.toString("hex");
    User.findOne({ username: req.body.username }).then((user) => {
      if (!user) {
        return res
          .status(422)
          .json({ error: "User don't exists with that Email" });
      }
      user.resetToken = token;
      user.expireToken = Date.now() + 3600000;
      user.save().then((result) => {
        // transporter.sendMail({
        //   to: user.username,
        //   from: USER,
        //   subject: "Password Reset",
        //   html: `
        //              <p>You requested for password reset</p>
        //              <h5>click in this <a href="http://localhost:3000/reset/${token}">link</a> to reset password</h5>
        //              `,
        // });
        // res.json({ message: "Check your Email" });
      });
    });
  });
});

//New Password Process

router.post("/newpassword", (req, res) => {
  const newPassword = req.body.password;
  const sentToken = req.body.token;
  User.findOne({
    resetToken: sentToken,
    expireToken: { $gt: Date.now() },
  }).then((user) => {
    if (!user) {
      return res.status(422).json({ error: "Try again session expired" });
    } else {
      console.log("idhar bhi aa gya");
      user.setPassword(newPassword, function(err, user) {
        if (err) {
          console.log("shit idhar aa gya " + err);
          res.json({
            success: false,
            message: "Password could not be saved. Please try again!",
          });
        } else {
          console.log("Yipeeee Password change");
          res.json({
            success: true,
            message: "Your new password has been saved successfully",
          });
        }
      });
    }
  });
});

module.exports = router;
