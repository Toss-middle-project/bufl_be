const express = require("express");
const router = express.Router();
const db = require("../db/db");

// 사용자별 총 소비 내역 목록 조회 API
router.get("/:user_id/expenses", async (req, res) => {
  const { user_id } = req.params; // URL에서 user_id 가져오기

  try {
    // 1. 사용자가 보유한 모든 계좌 조회
    const [accounts] = await db
      .promise()
      .query("SELECT account_id FROM Account WHERE user_id = ?", [user_id]);

    if (accounts.length === 0) {
      return res
        .status(404)
        .json({ message: "해당 사용자의 계좌가 없습니다." });
    }

    let totalConsumption = 0;
    let transactions = [];

    // 2. 각 계좌에 대한 출금 내역을 조회하고 총 소비액 계산
    for (const account of accounts) {
      const [accountTransactions] = await db
        .promise()
        .query(
          `SELECT tran_amt FROM Transaction WHERE account_id = ? AND inout_type = 'OUT'`,
          [account.account_id]
        );

      // 3. 출금 내역 합산
      accountTransactions.forEach((transaction) => {
        totalConsumption += parseFloat(transaction.tran_amt);
        transactions.push(transaction); // 소비 내역을 추후에 반환할 수 있도록 저장
      });
    }

    // 4. 총 소비 내역 반환
    res.status(200).json({
      message: `${user_id}의 총 소비 내역`,
      totalConsumption: totalConsumption, // 총 소비액
      transactions: transactions, // 각 계좌의 출금 내역
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});
