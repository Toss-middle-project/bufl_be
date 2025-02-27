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
router.get("/", async (req, res) => {
  try {
    res.json({ message: "시작 화면입니다." });
  } catch (err) {
    console.error("시작 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

//회원가입 로직
router.post("/", async (req, res) => {
  const { user_name, user_regnu, user_phone, user_password } = req.body;
  try {
    if (!user_name || !user_regnu || !user_phone || !user_password) {
      return res.status(400).json({ message: "모든 정보를 입력하세요." });
    }

    if (user_password.length < 6) {
      return res
        .status(400)
        .json({ message: "비밀번호는 6자리 이상이어야 합니다." });
    }

    const [results] = await db.query(
      "SELECT * FROM Users WHERE user_regnu = ? OR user_phone = ?",
      [user_regnu, user_phone]
    );
    if (results.length > 0) {
      return res.status(400).json({ message: "이미 가입된 회원입니다." });
    }

    const [result] = await db.query(
      "INSERT INTO Users (user_name, user_regnu, user_phone, user_password) VALUES (?, ?, ?, ?)",
      [user_name, user_regnu, user_phone, user_password]
    );

    req.session.user = {
      user_name,
      user_phone,
      user_password,
    };

    res.status(201).json({ message: "회원가입 성공" });
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

//PiN 번호 입력 화면
router.get("/login", async (req, res) => {
  try {
    res.json({ message: "PIN 번호 화면입니다." });
  } catch (err) {
    console.error("PIM 번호 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

//PIN번호 로직
router.post("/login", async (req, res) => {
  // 경로를 /login으로 수정
  const { user_password } = req.body;
  const user_phone = req.session.user.user_phone;

  try {
    if (user_password) {
      const [results] = await db.query(
        "SELECT user_id FROM Users WHERE user_password = ? AND user_phone = ?",
        [user_password, user_phone]
      );

      if (results.length > 0) {
        req.session.is_logined = true; // 세션 정보 갱신
        req.session.user_id = results[0].user_id;
        res.status(201).json({ message: "로그인 성공" });
      } else {
        res.send(`
          <script type="text/javascript">
            alert("로그인 정보가 일치하지 않습니다.");
            document.location.href="/api/users/login";
          </script>
        `);
      }
    }
  } catch (err) {
    console.error("로그인 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

//월급 정보 입력 화면
router.get("/salary", async (req, res) => {
  try {
    res.json({ message: "월급 정보 입력 화면입니다." });
  } catch (err) {
    console.error("PIM 번호 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

// 월급 정보 입력
router.post("/salary", async (req, res) => {
  const { amount, pay_date, account_id } = req.body;
  try {
    if (!amount || !pay_date || !account_id) {
      return res.status(400).json({ message: "모든 정보를 입력하세요!" });
    }

    const [userResult] = await db.query(
      "SELECT user_id FROM Account WHERE account_id = ?",
      [account_id]
    );
    if (userResult.length === 0) {
      return res.status(404).json({ message: "Account not found" });
    }
    const user_id = userResult[0].user_id;

    const [salaryResult] = await db.query(
      "INSERT INTO Salary (account_id, user_id, amount, pay_date, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [account_id, user_id, amount, pay_date]
    );
    res.status(201).json({
      message: "월급 입력정보 성공",
      salary_id: salaryResult.insertId,
    });
  } catch (err) {
    console.error("월급 정보 입력 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.get("/interests", async (req, res) => {
  try {
    res.json({ message: "관심사 선택 화면입니다." });
  } catch {
    console.error("관심사 선택 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

router.post("/interests", async (req, res) => {
  const user_id = req.session.user_id;
  const { interests } = req.body;

  try {
    if (!user_id) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    const values = interests.map((interest) => [user_id, interest]);

    const [insertResult] = await db.query(
      "INSERT INTO Interests (user_id, name) VALUES ?",
      [values]
    );

    res.json({ message: "관심사 등록 성공" });
  } catch (err) {
    console.error("관심사 등록 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
