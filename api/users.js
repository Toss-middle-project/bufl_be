const express = require("express");
const session = require("express-session");
const router = express.Router();
const db = require("../db/db");

// 시작 화면
router.get("/", async (req, res) => {
  try {
    res.json({ message: "시작 화면입니다." });
  } catch (err) {
    console.error("시작 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

// 회원가입 로직
router.post("/", async (req, res) => {
  const { userName, userRegnu, userPhone, userPassword } = req.body;
  try {
    if (!userName || !userRegnu || !userPhone || !userPassword) {
      return res.status(400).json({ message: "모든 정보를 입력하세요." });
    }

    if (userPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "비밀번호는 6자리 이상이어야 합니다." });
    }

    const [results] = await db.query(
      "SELECT * FROM Users WHERE user_regnu = ? OR user_phone = ?",
      [userRegnu, userPhone]
    );
    if (results.length > 0) {
      return res.status(400).json({ message: "이미 가입된 회원입니다." });
    }

    const [result] = await db.query(
      "INSERT INTO Users (user_name, user_regnu, user_phone, user_password) VALUES (?, ?, ?, ?)",
      [userName, userRegnu, userPhone, userPassword]
    );

    req.session.user = {
      userName,
      userPhone,
      userPassword,
    };

    res.status(201).json({ message: "회원가입 성공" });
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// PiN 번호 입력 화면
router.get("/login", async (req, res) => {
  try {
    res.json({ message: "PIN 번호 화면입니다." });
  } catch (err) {
    console.error("PIN 번호 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

// PIN번호 로직
router.post("/login", async (req, res) => {
  const { userPassword } = req.body;
  const userPhone = req.session.user.userPhone;

  try {
    if (userPassword) {
      const [results] = await db.query(
        "SELECT user_id FROM Users WHERE user_password = ? AND user_phone = ?",
        [userPassword, userPhone]
      );

      if (results.length > 0) {
        req.session.isLogined = true; // 세션 정보 갱신
        req.session.userId = results[0].user_id;
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

// 월급 정보 입력 화면
router.get("/salary", async (req, res) => {
  try {
    res.json({ message: "월급 정보 입력 화면입니다." });
  } catch (err) {
    console.error("월급 정보 입력 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

// 월급 정보 입력
router.post("/salary", async (req, res) => {
  const { amount, payDate, accountId } = req.body;
  try {
    if (!amount || !payDate || !accountId) {
      return res.status(400).json({ message: "모든 정보를 입력하세요!" });
    }

    const [userResult] = await db.query(
      "SELECT user_id FROM Account WHERE account_id = ?",
      [accountId]
    );
    if (userResult.length === 0) {
      return res.status(404).json({ message: "Account not found" });
    }
    const userId = userResult[0].user_id;

    const [salaryResult] = await db.query(
      "INSERT INTO Salary (account_id, user_id, amount, pay_date, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [accountId, userId, amount, payDate]
    );
    res.status(201).json({
      message: "월급 입력정보 성공",
      salaryId: salaryResult.insertId,
    });
  } catch (err) {
    console.error("월급 정보 입력 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.get("/interests", async (req, res) => {
  try {
    res.json({ message: "관심사 선택 화면입니다." });
  } catch (err) {
    console.error("관심사 선택 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

router.post("/interests", async (req, res) => {
  const userId = req.session.userId;
  const { interests } = req.body;

  try {
    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    const values = interests.map((interest) => [userId, interest]);

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
