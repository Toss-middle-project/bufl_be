const express = require("express");
const session = require("express-session");
const router = express.Router();
const db = require("../db/db");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

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

    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE user_regnu = ? OR user_phone = ?",
      [userRegnu, userPhone]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "이미 가입된 회원입니다." });
    }
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    const [result] = await db.query(
      "INSERT INTO users (user_name, user_regnu, user_phone, user_password) VALUES (?, ?, ?, ?)",
      [userName, userRegnu, userPhone, hashedPassword]
    );

    const sessionId = uuidv4();
    await db.query("INSERT INTO sessions (user_id, session_id) VALUES (?, ?)", [
      result.insertId,
      sessionId,
    ]);

    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: false, // 배포 시 true (HTTPS 필수)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일 유지
    });

    res.status(201).json({ message: "회원가입 및 자동 로그인 완료" });
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
router.get("/pin", async (req, res) => {
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
router.post("/pin", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  const { userPassword } = req.body;

  if (!sessionId) return res.status(401).json({ message: "세션 없음" });
  try {
    if (userPassword) {
      const [session] = await db.query(
        "SELECT user_id FROM sessions WHERE session_id = ?",
        [sessionId]
      );

      if (session.length === 0)
        return res.status(401).json({ message: "세션 만료됨" });

      const [user] = await db.query("SELECT * FROM users WHERE user_id = ?", [
        session[0].user_id,
      ]);

      if (!user.length)
        return res.status(401).json({ message: "사용자 정보 없음" });

      const hashedPassword = user[0].user_password;

      bcrypt.compare(userPassword, hashedPassword, (err, isMatch) => {
        if (err) throw err;

        if (isMatch) {
          res.status(201).json({ message: "PIN 번호 인증 성공" });
        } else {
          res.status(400).json({ message: "PIN 번호 인증 오류" });
        }
      });
    }
  } catch (err) {
    console.error("PIN 번호 인증 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 월급 정보
/**
 * @swagger
 * /salary:
 *   get:
 *     summary: "사용자의 월급 정보 조회"
 *     description: "로그인된 사용자의 월급 정보(계좌 정보, 금액, 지급일)를 조회합니다."
 *     responses:
 *       200:
 *         description: "월급 정보 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 salaryAccount:
 *                   type: object
 *                   properties:
 *                     bank_name:
 *                       type: string
 *                       description: "은행 이름"
 *                     account_number:
 *                       type: string
 *                       description: "계좌 번호"
 *                 amount:
 *                   type: number
 *                   description: "월급 금액"
 *                 payDate:
 *                   type: string
 *                   format: date
 *                   description: "월급 지급일 (YYYY-MM-DD 형식)"
 *       500:
 *         description: "서버 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버오류"
 *       400:
 *         description: "잘못된 요청"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "로그인 필요"
 *     security:
 *       - bearerAuth: []
 */
router.get("/salary", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });

  try {
    const [session] = await db.query(
      "SELECT user_id FROM sessions WHERE session_id = ?",
      [sessionId]
    );

    //session  없으면 만료
    if (session.length === 0)
      return res.status(401).json({ message: "세션 만료됨" });

    const userId = session[0].user_id;

    const [salary] = await db.query(
      "SELECT account_id, amount, pay_date FROM salary WHERE user_id = ?",
      [userId]
    );

    const salaryAccountId = salary[0].account_id;
    const [salaryAccount] = await db.query(
      "SELECT bank_name, account_number FROM account WHERE account_id = ?",
      [salaryAccountId]
    );

    res.status(200).json({
      salaryAccount: salaryAccount[0],
      amount: salary[0].amount,
      payDate: salary[0].pay_date,
    });
  } catch (err) {
    console.error("월급 정보 입력 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

/**
 * @swagger
 * /api/users/salary:
 *   post:
 *     summary: "월급 정보 입력"
 *     description: "사용자가 월급 정보를 입력하여 DB에 저장합니다."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: "월급 액수"
 *               payDate:
 *                 type: string
 *                 format: date
 *                 description: "월급 지급일"
 *               accountId:
 *                 type: string
 *                 description: "사용자 계좌 ID"
 *     responses:
 *       201:
 *         description: "월급 정보 입력 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "월급 입력정보 성공"
 *                 salaryId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: "모든 정보를 입력하지 않음"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "모든 정보를 입력하세요!"
 *       404:
 *         description: "계좌를 찾을 수 없음"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Account not found"
 *       500:
 *         description: "서버 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버 오류"
 */

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
/**
 * @swagger
 * /api/users/interests:
 *   get:
 *     summary: "관심사 선택 화면"
 *     description: "사용자에게 관심사를 선택할 수 있는 화면을 반환합니다."
 *     responses:
 *       200:
 *         description: "관심사 선택 화면"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "관심사 선택 화면입니다."
 *       500:
 *         description: "서버 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버오류"
 */
router.get("/interests", async (req, res) => {
  try {
    res.json({ message: "관심사 선택 화면입니다." });
  } catch (err) {
    console.error("관심사 선택 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

/**
 * @swagger
 * /api/users/interests:
 *   post:
 *     summary: "관심사 등록"
 *     description: "사용자가 선택한 관심사를 등록합니다."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "사용자가 선택한 관심사 목록"
 *     responses:
 *       200:
 *         description: "관심사 등록 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "관심사 등록 성공"
 *       401:
 *         description: "로그인이 필요함"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "로그인이 필요합니다."
 *       500:
 *         description: "서버 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "서버 오류"
 */

router.post("/interests", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });
  const { interest } = req.body;

  try {
    const [session] = await db.query(
      "SELECT user_id FROM sessions WHERE session_id = ?",
      [sessionId]
    );

    if (session.length === 0)
      return res.status(401).json({ message: "세션 만료됨" });

    const userId = session[0].user_id;

    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    const [insertResult] = await db.query(
      "INSERT INTO interests (user_id, name) VALUES (?, ?)",
      [userId, interest]
    );

    res.json({ message: "관심사 등록 성공" });
  } catch (err) {
    console.error("관심사 등록 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

//회원 탈퇴
/**
 * @swagger
 * /api/users/delete:
 *   delete:
 *     summary: "회원 탈퇴"
 *     description: "사용자가 계정을 탈퇴합니다. 탈퇴 시 연관된 모든 데이터를 삭제합니다."
 *     responses:
 *       200:
 *         description: "회원 탈퇴 완료"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "회원 탈퇴 완료"
 *       401:
 *         description: "로그인이 필요함"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "로그인이 필요합니다."
 *       404:
 *         description: "사용자 정보 찾을 수 없음"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "회원 정보를 찾을 수 없습니다."
 *       500:
 *         description: "서버 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버 오류"
 */
router.delete("/delete", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });

  try {
    const [session] = await db.query(
      "SELECT user_id FROM sessions WHERE session_id = ?",
      [sessionId]
    );

    //session  없으면 만료
    if (session.length === 0)
      return res.status(401).json({ message: "세션 만료됨" });

    const userId = session[0].user_id;
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
    await db.query("DELETE FROM sessions WHERE session_id = ?", [sessionId]);
    // ✅ 2. 쿠키 제거
    res.clearCookie("sessionId");
    res.json({ message: "회원탈퇴 완료" });
  } catch (err) {
    console.error("회원 탈퇴 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
