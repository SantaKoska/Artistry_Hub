const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // extract token from "Bearer <token> from the front end"
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ err: "No token provided" });
  }

  jwt.verify(token, process.env.jwt_sckey, (err, decoded) => {
    if (err) {
      console.log("Token verification failed:", err);
      return res.status(401).json({ err: "Failed to authenticate token" });
    }

    req.user = decoded; // Attach decoded user info to req
    //debugging
    // console.log("what we get:", req.user);
    //
    next();
  });
};

module.exports = { verifyToken };
