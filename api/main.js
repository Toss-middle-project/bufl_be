const express = require("express");
const session = require("express-session");
const router = express.Router();
router.get("/profile", (req, res) => {
  if (req.session.user) {
    // 로그인된 상태
    res.status(200).json({ message: "로그인 상태", user: req.session.user });
  } else {
    // 로그인되지 않은 상태
    res.status(401).json({ message: "로그인 필요" });
  }
});

module.exports = router;
