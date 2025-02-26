var express = require("express");
const session = require("express-session");
var router = express.Router();
var db = require("../db/db");

// 로그인 프로세스
router.post("/login", function (req, res) {
  // 경로를 /login으로 수정
  var user_password = req.body.user_password;
  if (user_password) {
    db.query(
      "SELECT * FROM Users WHERE user_password = ?",
      [user_password],
      function (error, results) {
        if (error) throw error;
        if (results.length > 0) {
          res.send("로그인 성공");
          // req.session.is_logined = true; // 세션 정보 갱신
          // req.session.save(function () {
          //   res.redirect(`/`);
          // });
        } else {
          res.send(`<script type="text/javascript">alert("로그인 정보가 일치하지 않습니다."); 
              document.location.href="/api/users/login";</script>`);
        }
      }
    );
  } else {
    res.send(`<script type="text/javascript">alert("비밀번호를 입력하세요!"); 
      document.location.href="/api/users/login";</script>`);
  }
});

module.exports = router;
