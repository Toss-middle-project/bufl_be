const express = require("express");
const session = require("express-session");
const router = express.Router();
const db = require("../db/db");

router.get("/category", async (req, res) => {
  const userId = req.session.userId;
  // const userId = 44;
  if (!userId) {
    res.json.status(400).json({ message: "로그인이 필요합니다." });
  }
  try {
    const [salaryAccount] = await db.query(
      "SELECT bank_name, account_number FROM account WHERE account_id = (SELECT account_id FROM salary WHERE user_id = ?)",
      [userId]
    );
    const [categories] = await db.query(
      "SELECT name, goal_amount, background_color, ratio, amount FROM categories WHERE user_id = ?",
      [userId]
    );

    // 반환할 데이터 정리
    const result = categories.map((category) => {
      if (category.name === "월급 통장") {
        return {
          ...category,
          bank_name: salaryAccount.length ? salaryAccount[0].bank_name : null,
          account_number: salaryAccount.length
            ? salaryAccount[0].account_number
            : null,
        };
      }
      return category;
    });

    res.status(201).json({ categories: result });
  } catch (err) {
    console.error("월급쪼개기 화면 오류", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.post("/category", async (req, res) => {
  const userId = req.session.userId;
  // const userId = 44;
  const categories = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ message: "카테고리 정보가 잘못되었습니다." });
  }
  try {
    let totalPercentage = 0;
    for (const category of categories) {
      totalPercentage += category.ratio || 0;
    }

    if (totalPercentage !== 100) {
      return res
        .status(400)
        .json({ message: "비율합이 100이이 되어야함니다." });
    }

    const [salary] = await db.query(
      "SELECT amount FROM salary WHERE user_id = ?",
      [userId]
    );
    if (salary.length === 0) {
      return res.status(400).json({ message: "월급 정보가 없습니다." });
    }

    // 각 카테고리의 amount 계산
    const values = categories.map((category) => {
      const salaryAmount = salary[0]?.amount || 0;
      const amount = (salaryAmount * category.ratio) / 100;
      return [
        userId,
        category.name,
        category.goal_amount || 0,
        category.background_color,
        category.ratio || 0,
        amount,
      ];
    });

    const [result] = await db.query(
      "INSERT INTO categories (user_id, name, goal_amount, background_color, ratio, amount) VALUES ?",
      [values]
    );

    res
      .status(201)
      .json({ message: `${categories.length}개의 카테고리가 추가되었습니다.` });
  } catch (err) {
    console.error("카테고리 추가 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.delete("/category/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;

    const [category] = await db.query("SELECT * FROM categories WHERE id = ?", [
      categoryId,
    ]);

    if (category.length === 0) {
      return res.status(400).json({ message: "카테고리가 없습니다." });
    }

    const [result] = await db.query("DELETE FROM categories WHERE id =?", [
      categoryId,
    ]);

    res.status(200).json({ message: "카테고리 삭제 성공" });
  } catch (err) {
    console.error("카테고리 삭제 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
