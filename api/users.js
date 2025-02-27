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

//시작 화면
router.get("/", (req, res) => {
  res.json({ message: "=시작 화면입니다." });
});

//회원가입 로직
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
            user_name,
            user_phone,
            user_password,
          };

          res.status(201).json({ message: "회원가입 성공" });
        }
      );
    }
  );
});

//PiN 번호 입력 화면
router.get("/login", (req, res) => {
  res.json({ message: "로그인 화면입니다." });
});

//PIN번호 로직
router.post("/login", function (req, res) {
  // 경로를 /login으로 수정
  var user_password = req.body.user_password;
  var user_phone = req.session.user.user_phone;
  if (user_password) {
    db.query(
      "SELECT user_id FROM Users WHERE user_password = ? AND user_phone =?",
      [user_password, user_phone],
      function (error, results) {
        if (error) throw error;
        if (results.length > 0) {
          req.session.is_logined = true; // 세션 정보 갱신
          req.session.user_id = results[0].user_id;
          res.status(201).json({ message: "로그인 성공" });
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

//월급 정보 입력 화면
router.get("/salary", (req, res) => {
  res.json({ message: "월급 정보 입력 화면입니다." });
});

// 월급 정보 입력
router.post("/salary", (req, res) => {
  const { amount, pay_date, account_id } = req.body;

  if (!amount || !pay_date || !account_id) {
    return res.status(400).json({ message: "모든 정보를 입력하세요!" });
  }

  const getUserIdQuery = `SELECT user_id FROM Account WHERE account_id = ?`;
  db.query(getUserIdQuery, [account_id], (err, results) => {
    if (err) {
      console.error("Error fetching user_id:", err);
      return res
        .status(500)
        .json({ message: "Error fetching user information" });
    }
    if (results.length == 0) {
      return res.status(404).json({ message: "Account not found" });
    }

    const user_id = results[0].user_id;

    const insertSalaryQuery = `
    INSERT INTO Salary (account_id, user_id, amount, pay_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `;

    db.query(
      insertSalaryQuery,
      [account_id, user_id, amount, pay_date],
      (err, result) => {
        if (err) {
          console.error("월급 정보 입력 실패");
          return res.status(500).json({ message: "서버오류" });
        }
        res
          .status(201)
          .json({ message: "월급 입력정보 성공", salary_id: result.insertId });
      }
    );
  });
});

router.get("/interests", (req, res) => {
  const user_id = req.session.user_id;
  const { interests } = req.body;
});

module.exports = router;
