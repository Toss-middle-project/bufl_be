const express = require("express");
const session = require("express-session");
const router = express.Router();
const db = require("../db/db");

// router.get("/", async (req, res) => {
//   // const user_id = req.session.user_id;
//   const user_id = 43;

//   if (!user_id) {
//     return res.status(400).json({ message: "로그인이 필요합니다." });
//   }
//   //비율조정 화면
//   try {
//     // 사용자의 월급 통장 급여 배분 정보 조회
//     const [salaryAllocations] = await db.query(
//       "SELECT * FROM salary_allocations WHERE user_id = ? AND category_id = (SELECT id FROM Categories WHERE name = '월급 통장' LIMIT 1)",
//       [user_id]
//     );

//     if (salaryAllocations.length === 0) {
//       // '월급 통장' 카테고리가 없는 경우, 카테고리 생성
//       const [existingCategory] = await db.query(
//         "SELECT id FROM Categories WHERE user_id = ? AND name = '월급 통장'",
//         [user_id]
//       );

//       if (existingCategory.length === 0) {
//         // 카테고리가 없다면, 카테고리 생성
//         await db.query(
//           "INSERT INTO Categories (user_id, name, goal_amount, background_color, created_at) VALUES (?, ?, ?, ?, NOW())",
//           [user_id, "월급 통장", 0, "#E3E4E8"]
//         );
//       }

//       // '월급 통장' 카테고리 ID 조회
//       const [salaryResult] = await db.query(
//         "SELECT id FROM Categories WHERE name = '월급 통장' AND user_id = ?",
//         [user_id]
//       );

//       const salaryCategoryId = salaryResult[0].id;

//       // 월급 통장 비율 100%로 급여 배분 추가
//       await db.query(
//         "INSERT INTO salary_allocations (user_id, category_id, percentage) VALUES (?, ?, ?)",
//         [user_id, salaryCategoryId, 100]
//       );
//     }
//     // 급여 배분 정보 조회
//     const [allocations] = await db.query(
//       "SELECT c.id AS category_id, c.name, sa.percentage FROM salary_allocations sa JOIN Categories c ON sa.category_id = c.id WHERE sa.user_id = ?",
//       [user_id]
//     );

//     res.status(200).json({ categories: allocations });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "서버 오류가 발생했습니다." });
//   }
// });

// router.post("/", async (req, res) => {
//   //비율조정
//   // const user_id = req.session.user_id;
//   const user_id = 43;
//   const { budgets } = req.body;
//   if (!user_id || !Array.isArray(budgets) || budgets.length === 0) {
//     return res.status(400).json({ error: "잘못된 요청입니다." });
//   }
//   try {
//     const [categories] = await db.query(
//       "SELECT id, name  FROM Categories WHERE user_id = ? ",
//       [user_id]
//     );

//     const [salary] = await db.query(
//       "SELECT amount FROM Salary WHERE user_id = ?",
//       [user_id]
//     );
//     if (salary.length === 0) {
//       return res.status(400).json({ message: "월급 정보가 없습니다." });
//     }

//     let totalPercentage = 0;
//     for (const budget of budgets) {
//       totalPercentage += budget.percentage;
//     }

//     if (totalPercentage !== 100) {
//       return res.status(400).json({ error: "비율 합계는 100%여야 합니다." });
//     }

//     await db.query("DELETE FROM salary_allocations WHERE user_id = ?", [
//       user_id,
//     ]);

//     for (const budget of budgets) {
//       const salaryAmount = salary[0]?.amount || 0;
//       const amount = (salaryAmount * budget.percentage) / 100;
//       await db.query(
//         "INSERT INTO salary_allocations (user_id, category_id, percentage, amount, created_at) VALUES (?, ?, ?, ?, NOW())",
//         [user_id, budget.category_id, budget.percentage, amount]
//       );
//     }
//     res
//       .status(201)
//       .json({ message: "비율 설정이 성공적으로 완료되었습니다. " });
//   } catch (err) {
//     console.error("월급쪼개기 설정 오류", err);
//     res.status(500).json({ message: "서버 오류" });
//   }
// });

router.get("/category", async (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    res.json.status(400).json({ message: "로그인이 필요합니다." });
  }
  try {
    const [salaryAccount] = await db.query(
      "SELECT bank_name, account_number FORM Account WHERE account_id = (SELECT account_id FROM Salary WHERE user_id = ?)",
      [user_id]
    );
    const [categories] = await db.query(
      "SELECT name, goal_amount, background_color, ratio FROM Categories WHEHR user_id = ?",
      [user_id]
    );

    res.status(201).json({ salary: salaryAccount, categories: categories });
  } catch (err) {
    console.error("월급쪼개기 화면 오류", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.post("/category", async (req, res) => {
  // const user_id = req.session.user_id;
  const user_id = 43;
  const categories = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ message: "카테고리 정보가 잘못되었습니다." });
  }
  try {
    let totalPercentage = 0;
    for (const category of chategories) {
      totalPercentage += category.ratio || 0;
    }

    if (totalPercentage !== 100) {
      return res
        .status(400)
        .json({ message: "비율합이 100이이 되어야함니다." });
    }

    const [salary] = await db.query(
      "SELECT amount FROM Salary WHERE user_id = ?",
      [user_id]
    );
    if (salary.length === 0) {
      return res.status(400).json({ message: "월급 정보가 없습니다." });
    }

    // 각 카테고리의 amount 계산
    const values = categories.map((category) => {
      const salaryAmount = salary[0]?.amount || 0;
      const amount = (salaryAmount * category.ratio) / 100;
      return [
        user_id,
        category.name,
        category.goal_amount || 0,
        category.background_color,
        category.ratio || 0,
        amount,
      ];
    });

    const [result] = await db.query(
      "INSERT INTO Categories (user_id, name, goal_amount, background_color, ratio, amount) VALUES ?",
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

module.exports = router;
