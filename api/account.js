const express = require("express");
const router = express.Router();
const db = require("../db/db");

// 계좌 목록 조회 API
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM account");
    if (results.length === 0) {
      return res.status(404).json({ message: "등록된 계좌가 없습니다." });
    }
    res.status(200).json({ message: "계좌목록 조회 성공", accounts: results });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "서버오류" });
  }
});

//아이디별 목록 조회
router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params; //URL에서 user_id 가져오기

  try {
    const [results] = await db.query(
      "SELECT * FROM account WHERE user_id = ?",
      [user_id]
    );
    if (results.length == 0) {
      return res.status(404).json({ message: "해당 사용자 계좌가 없습니다." });
    }
    res
      .status(200)
      .json({ message: `${user_id}의 계좌목록`, accounts: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버오류" });
  }
});

// 계좌 내역 조회 API
router.get("/:account_id/transactions", async (req, res) => {
  const { account_id } = req.params; // URL 파라미터에서 user_id 가져오기

  // account_id가 제공되지 않았거나 유효하지 않음.
  if (!account_id) {
    return res.status(400).json({ message: "계좌 ID를 제공해 주세요." });
  }

  try {
    const [results] = await db.query(
      `SELECT 
      t.transaction_id, 
      t.from_account_number, 
      t.to_account_number, 
      t.inout_type, 
      t.tran_amt, 
      t.tran_balance_amt,
      transaction_time
   FROM transaction t
   WHERE t.account_id = ?`,
      [account_id]
    );
    if (results.length === 0) {
      return res.status(404).json({ message: "계좌가 없습니다." });
    }
    res.status(200).json({
      message: `계좌 ${account_id}의 거래 내역`,
      transaction: results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버오류" });
  }
});

// 계좌별 잔액 조회
router.get("/:account_id/balance", async (req, res) => {
  const { account_id } = req.params; // URL 파라미터에서 account_id 가져오기

  if (!account_id) {
    return res.status(400).json({ message: "계좌 ID를 제공해 주세요." });
  }

  try {
    // 1. 초기 잔액을 Account 테이블에서 조회
    const [accountResults] = await db.query(
      `SELECT balance FROM account WHERE account_id = ?`,
      [account_id]
    );

    if (accountResults.length === 0) {
      return res.status(404).json({ message: "계좌가 존재하지 않습니다." });
    }

    let balance = parseFloat(accountResults[0].balance); // 초기 잔액

    // 2. 해당 계좌의 거래 내역을 조회하여 잔액 계산
    const [transactionResults] = await db.query(
      `SELECT tran_amt, inout_type FROM transaction WHERE account_id = ?`,
      [account_id]
    );

    // 3. 거래 내역 반영하여 잔액 계산
    transactionResults.forEach((transaction) => {
      if (transaction.inout_type === "IN") {
        balance += parseFloat(transaction.tran_amt); // 입금일 경우 잔액 추가
      } else if (transaction.inout_type === "OUT") {
        balance -= parseFloat(transaction.tran_amt); // 출금일 경우 잔액 차감
      }
    });

    // 4. 최종 잔액 반환
    res.status(200).json({ balance: balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
