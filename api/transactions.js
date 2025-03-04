const express = require("express");
const session = require("express-session");
const router = express.Router();
const db = require("../db/db");
const schedule = require("node-schedule");

// 자동이체 실행 함수
/**
 * @swagger
 * /transfer:
 *   post:
 *     summary: 자동이체 일정 등록
 *     description: 사용자의 월급통장과 연동된 계좌들로 자동이체 일정 등록
 *     tags:
 *       - 자동이체
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: 사용자의 ID
 *                 example: 44
 *     responses:
 *       200:
 *         description: 자동이체 일정 등록 완료
 *       400:
 *         description: 월급 계좌 또는 카테고리 정보를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

// 자동이체 함수
async function executeAutoTransfer(
  fromAccountId,
  toAccountId,
  amount,
  description
) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    console.log("✅ 출금 계좌 ID:", fromAccountId);

    // 출금 계좌 확인
    const [fromAccount] = await connection.query(
      "SELECT * FROM account WHERE account_id = ? FOR UPDATE",
      [fromAccountId]
    );

    const fromBalance = Number(fromAccount[0].balance);

    if (fromAccount.length === 0) {
      throw new Error("출금 계좌를 찾을 수 없습니다.");
    }

    if (fromBalance < amount) {
      throw new Error("잔액이 부족합니다.");
    }

    // 출금 처리
    await connection.query(
      "UPDATE account SET balance = balance - ? WHERE account_id = ?",
      [amount, fromAccountId]
    );

    // 입금 계좌 확인
    const [toAccount] = await connection.query(
      "SELECT * FROM account WHERE account_id = ? FOR UPDATE",
      [toAccountId]
    );

    if (toAccount.length === 0) {
      throw new Error("입금 계좌를 찾을 수 없습니다.");
    }

    // 입금 처리
    await connection.query(
      "UPDATE account SET balance = balance + ? WHERE account_id = ?",
      [amount, toAccountId]
    );

    // 트랜잭션 기록 (출금)
    await connection.query(
      `INSERT INTO transaction 
        (account_id, from_account_number, to_account_number, inout_type, tran_amt, tran_balance_amt, tran_desc, transaction_time) 
        VALUES (?, ?, ?, 'OUT', ?, ?, ?, NOW())`,
      [
        fromAccountId,
        fromAccount[0].account_number,
        toAccount[0].account_number,
        amount,
        fromBalance - amount,
        description,
      ]
    );

    const toBalance = Number(toAccount[0].balance);
    const toAmount = Number(amount);
    // 트랜잭션 기록 (입금)
    await connection.query(
      `INSERT INTO transaction 
        (account_id, from_account_number, to_account_number, inout_type, tran_amt, tran_balance_amt, tran_desc, transaction_time) 
        VALUES (?, ?, ?, 'IN', ?, ?, ?, NOW())`,
      [
        toAccountId,
        fromAccount[0].account_number,
        toAccount[0].account_number,
        amount,
        toBalance + toAmount,
        description,
      ]
    );

    await connection.commit();
    console.log(
      `✅ 자동이체 완료: ${amount}원 from ${fromAccount[0].account_number} to ${toAccount[0].account_number}`
    );
  } catch (err) {
    await connection.rollback();
    console.error("❌ 자동이체 실패:", err.message);
  } finally {
    connection.release();
  }
}

// 자동이체 일정 등록 API
/**
 * @swagger
 * /transfer:
 *   post:
 *     summary: 자동이체 일정 등록
 *     description: 사용자의 월급통장과 연동된 계좌들로 자동이체 일정 등록
 *     tags:
 *       - 자동이체
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: 사용자의 ID
 *                 example: 44
 *     responses:
 *       200:
 *         description: 자동이체 일정 등록 완료
 *       400:
 *         description: 월급 계좌 또는 카테고리 정보를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.post("/transfer", async (req, res) => {
  try {
    const userId = req.session.userId;
    // const userId = 44;

    // 사용자 월급통장 정보 가져오기
    const [fromAccount] = await db.query(
      "SELECT * FROM salary WHERE user_id = ?",
      [userId]
    );

    if (fromAccount.length === 0) {
      return res.status(400).json({ error: "월급 계좌를 찾을 수 없습니다." });
    }

    const fromAccountId = fromAccount[0].account_id;

    const [categories] = await db.query(
      "SELECT id, amount, account_id FROM categories WHERE user_id = ?",
      [userId]
    );

    if (categories.length === 0) {
      return res
        .status(400)
        .json({ error: "해당 카테고리를 찾을 수 없습니다." });
    }

    const categoriesToProcess = categories.slice(1);

    // 입금 계좌 정보 가져오기
    const autoTransferPromises = categoriesToProcess.map(async (category) => {
      const toAccountId = category.account_id;

      if (!toAccountId) {
        throw new Error("연동된 계좌가 없습니다.");
      }

      const [toAccount] = await db.query(
        "SELECT * FROM account WHERE account_id = ?",
        [toAccountId]
      );

      if (toAccount.length === 0) {
        throw new Error("입금 계좌를 찾을 수 없습니다.");
      }

      const amount = category.amount;

      const fiveMinutesLater = new Date();
      fiveMinutesLater.setMinutes(fiveMinutesLater.getMinutes() + 1);

      // 자동이체 일정 등록
      schedule.scheduleJob(fiveMinutesLater, () => {
        executeAutoTransfer(fromAccountId, toAccountId, amount, "자동이체");
      });
    });

    await Promise.all(autoTransferPromises);

    res.json({
      message: "✅ 자동이체 일정이 등록되었습니다.",
    });
  } catch (err) {
    console.error("❌ 자동이체 등록 실패:", err.message);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
