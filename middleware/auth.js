exports.User = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash("danger", "Please login email !");
    return res.redirect("/login");
  }
};

exports.Admin = function (req, res, next) {
  if (req.isAuthenticated() && req.user.role === "admin") {
    next();
  } else {
    req.flash("danger", "Access admin denied");
    return res.redirect("/login");
  }
};

exports.QAM = function (req, res, next) {
  if (req.isAuthenticated() && req.user.role === "qam") {
    next();
  } else {
    req.flash("danger", "Access QAM denied");
    return res.redirect("/login");
  }
};
