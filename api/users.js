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
          const user_id = results.insertId; // user_id 가져오기
          req.session.user_id = user_id; // 세션에 user_id 저장
          req.session.user_name = user_name; // 세션에 user_name 저장

          res.status(201).json({ message: "회원가입 성공" });
        }
      );
    }
  );
});

// 로그인
router.post("/login", function (req, res) {
  const user_password = req.body.user_password;
  const user_name = req.session.user_name; // 세션에서 user_name 가져오기

  if (!user_name) {
    return res
      .status(400)
      .json({ message: "세션 정보가 없습니다. 다시 회원가입해주세요." });
  }

  if (!user_password) {
    return res.send(`<script type="text/javascript">alert("비밀번호를 입력하세요!");
      document.location.href="/api/users/login";</script>`);
  }

  db.query(
    "SELECT * FROM Users WHERE user_name = ? AND user_password = ?",
    [user_name, user_password],
    function (error, results) {
      if (error) {
        console.error("로그인 오류:", error);
        return res.status(500).json({ message: "서버 오류" });
      }

      if (results.length > 0) {
        req.session.is_logined = true; // 로그인 성공 시 세션 갱신
        res.status(201).json({ message: "로그인 성공", user_name });
      } else {
        res.send(`<script type="text/javascript">alert("로그인 정보가 일치하지 않습니다.");
            document.location.href="/api/users/login";</script>`);
      }
    }
  );
});

// 회원탈퇴
router.delete("/", function (req, res) {
  const { user_id } = req.body; // body에서 user_id 가져오기

  if (!user_id) {
    return res.status(400).json({ message: "user_id를 입력하세요." });
  }

  db.query(
    "DELETE FROM Users WHERE user_id = ?",
    [user_id],
    function (error, results) {
      if (error) {
        console.error("회원 탈퇴 오류:", error);
        return res.status(500).json({ message: "서버 오류" });
      }

      if (results.affectedRows > 0) {
        return res.status(200).json({ message: "탈퇴 성공" });
      } else {
        return res
          .status(404)
          .json({ message: "해당 사용자가 존재하지 않습니다." });
      }
    }
  );
});

module.exports = router;
