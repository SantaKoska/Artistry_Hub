const jwt = require("jsonwebtoken");

exports = {};

exports.getToken = (user) => {
  const token = jwt.sign({ identifier: user._id }, process.env.jwt_sckey, {
    expiresIn: "4h",
  });

  return token;
};

module.exports = exports;
