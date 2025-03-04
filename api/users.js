const express = require("express");
const session = require("express-session");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: 회원관련 API
 */
// 시작 화면
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: "시작 화면"
 *     tags: [Users]
 *     description: "시작 화면을 표시합니다."
 *     responses:
 *       200:
 *         description: "성공적으로 시작 화면을 반환합니다."
 *       500:
 *         description: "서버 오류"
 */
router.get("/", async (req, res) => {
  try {
    res.json({ message: "시작 화면입니다." });
  } catch (err) {
    console.error("시작 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

// 회원가입 로직
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: "회원가입"
 *     tags: [Users]
 *     description: "새 사용자를 회원가입합니다."
 *     parameters:
 *       - in: body
 *         name: user
 *         description: "회원가입에 필요한 사용자 정보"
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             userName:
 *               type: string
 *               example: "이순자"
 *             userRegnu:
 *               type: string
 *               example: "600818-1218896"
 *             userPhone:
 *               type: string
 *               example: "010-5698-4879"
 *             userPassword:
 *               type: string
 *               example: "600818"
 *     responses:
 *       201:
 *         description: "회원가입 성공"
 *       400:
 *         description: "잘못된 요청 (모든 정보를 입력하세요.)"
 *       500:
 *         description: "서버 오류"
 */
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
      "SELECT * FROM users WHERE user_regnu = ? OR user_phone = ?",
      [userRegnu, userPhone]
    );
    if (results.length > 0) {
      return res.status(400).json({ message: "이미 가입된 회원입니다." });
    }

    const [result] = await db.query(
      "INSERT INTO users (user_name, user_regnu, user_phone, user_password) VALUES (?, ?, ?, ?)",
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
/**
 * @swagger
 * /api/users/login:
 *   get:
 *     summary: "PIN 번호 입력 화면"
 *     tags: [Users]
 *     description: "로그인 화면을 반환합니다."
 *     responses:
 *       200:
 *         description: "PIN 번호 화면을 반환합니다."
 *       500:
 *         description: "서버 오류"
 */
router.get("/login", async (req, res) => {
  try {
    res.json({ message: "PIN 번호 화면입니다." });
  } catch (err) {
    console.error("PIN 번호 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

// PIN번호 로직
/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: "로그인"
 *     tags: [Users]
 *     description: "사용자가 PIN 번호를 입력하여 로그인합니다."
 *     parameters:
 *       - in: body
 *         name: userPassword
 *         description: "사용자가 입력한 PIN 번호"
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             userPassword:
 *               type: string
 *               example: "600818"
 *     responses:
 *       201:
 *         description: "로그인 성공"
 *       400:
 *         description: "로그인 정보가 일치하지 않습니다."
 *       500:
 *         description: "서버 오류"
 */
router.post("/login", async (req, res) => {
  const { userPassword } = req.body;
  const userPhone = req.session.user.userPhone;

  try {
    if (userPassword) {
      const [results] = await db.query(
        "SELECT user_id FROM users WHERE user_password = ? AND user_phone = ?",
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
      "SELECT user_id FROM account WHERE account_id = ?",
      [accountId]
    );
    if (userResult.length === 0) {
      return res.status(404).json({ message: "Account not found" });
    }
    const userId = userResult[0].user_id;

    const [salaryResult] = await db.query(
      "INSERT INTO salary (account_id, user_id, amount, pay_date, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
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

// 관심사
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
      "INSERT INTO interests (user_id, name) VALUES ?",
      [values]
    );

    res.json({ message: "관심사 등록 성공" });
  } catch (err) {
    console.error("관심사 등록 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

//회원 탈퇴
router.delete("/delete", async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  try {
    //1. 연관 데이터 삭제 (월급 정보, 관심사 등)
    await db.query("DELETE FROM salary WHERE user_id = ?", [userId]);
    await db.query("DELETE FROM interests WHERE user_id = ?", [userId]);

    const [result] = await db.query("DELETE FROM users WHERE user_id = ?", [
      userId,
    ]);
    // 2. 사용자 계정 삭제
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "회원 정보를 찾을 수 없습니다." });
    }
    // 3. 세션 삭제
    req.session.destroy((err) => {
      if (err) {
        console.error("세션 삭제 오류:", err);
        return res.status(500).json({ message: "세션 삭제 실패" });
      }
      res.json({ message: "회원 탈퇴 완료" });
    });
  } catch (err) {
    console.error("회원 탈퇴 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
