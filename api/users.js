const express = require("express");
const session = require("express-session");
const router = express.Router();
const db = require("../db/db");

router.use(
  session({
    secret: "secret code", // 세션 암호화에 사용할 키
    resave: false, // 세션 변경 시마다 저장하는 설정
    saveUninitialized: true, // 세션 초기화 상태에서 저장할지 여부
    cookie: { secure: false }, // https를 사용할 경우 true로 설정
  })
);

router.post("/", (req, res) => {
  const { user_name, user_regnu, user_phone, user_password } = req.body;

  if (!user_name || !user_regnu || !user_phone || !user_password) {
    return res.status(400).json({ message: "모든 정보를 입력하세요." });
  }

  if (user_password.length < 6) {
    return res
      .status(400)
      .json({ message: "비밀번호는 6자리 이상이어야 합니다." });
  }

  // 기존 회원 확인
  db.query(
    "SELECT * FROM Users WHERE user_regnu = ? OR user_phone = ?",
    [user_regnu, user_phone],
    (err, results) => {
      if (err) {
        console.error("중복 체크 오류:", err);
        return res.status(500).json({ message: "서버 오류" });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: "이미 가입된 회원입니다." });
      }

      // 회원 정보 삽입
      db.query(
        "INSERT INTO Users (user_name, user_regnu, user_phone, user_password) VALUES (?, ?, ?, ?)",
        [user_name, user_regnu, user_phone, user_password],
        (err) => {
          if (err) {
            console.error("회원가입 오류:", err);
            return res.status(500).json({ message: "서버 오류" });
          }
          req.session.user = {
            user_id,
            user_name,
            user_password,
          };

          res.status(201).json({ message: "회원가입 성공" });
        }
      );
    }
  );
});

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
          res.status(201).json({ message: "로그인 성공" });
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
