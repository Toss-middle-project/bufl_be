const db = require("../db/db");

// 목표 직접 설정
exports.createGoal = async (req) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) throw new Error("세션 없음");

  const { monthly_saving, goal_duration } = req.body;

  if (!monthly_saving || !goal_duration) {
    throw new Error("모든 필드를 입력해주세요.");
  }

  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );

  if (session.length === 0) throw new Error("세션 만료됨");

  const userId = session[0].user_id;

  const monthly_saving_amt = monthly_saving;
  const goal_amount = monthly_saving_amt * goal_duration;
  const dynamicGoalName = `${goal_amount / 10000} 만원 모으기`;

  const [result] = await db.query(
    `INSERT INTO goal (goal_name, goal_amount, goal_duration, goal_start, goal_end, user_id, account_id, monthly_saving, current_amount)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MONTH), ?, 1, ?, ?)`,

    [
      dynamicGoalName,
      goal_amount,
      goal_duration,
      goal_duration,
      userId,
      monthly_saving_amt,
      0,
    ]
  );

  const goalId = result.insertId;

  let transactionMessage = "첫 자동이체 성공";
  let firstTransactionSuccess = false;

  const [accountResult] = await db.query("SELECT * FROM account WHERE id = 1");
  const account = accountResult[0];

  if (account.balance >= monthly_saving_amt) {
    const newBalance = account.balance - monthly_saving_amt;

    await db.query(`UPDATE account SET balance = ? WHERE id = 1`, [newBalance]);

    await db.query(`UPDATE goal SET current_amount = ? WHERE id = ?`, [
      monthly_saving_amt,
      goalId,
    ]);

    await db.query(
      `INSERT INTO transaction (account_id, from_account_number, to_account_number, inout_type, tran_amt, tran_balance_amt, tran_desc)
      VALUES (1, ?, ?, 'OUT', ?, ?, '목표 저축')`,
      [account.account_number, dynamicGoalName, monthly_saving_amt, newBalance]
    );

    firstTransactionSuccess = true;
  } else {
    transactionMessage = "첫 자동이체 실패 (계좌 잔액 부족)";
  }

  return {
    message: "목표가 설정되었습니다.",
    goal_id: goalId,
    account_number: account.account_number,
    first_transaction: firstTransactionSuccess,
    transaction_message: transactionMessage,
  };
};
function calculateGoalCompletionProbability(goalAmount, currentAmount) {
  if (goalAmount <= 0) {
    return 0;
  }

  const probability = Math.min((currentAmount / goalAmount) * 100, 100); // 100%를 초과하지 않도록 처리

  return probability;
}

// 목표 목록 조회
exports.getGoals = async (req) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) throw new Error("세션 없음");

  try {
    const [session] = await db.query(
      "SELECT user_id FROM sessions WHERE session_id = ?",
      [sessionId]
    );
    if (session.length === 0) throw new Error("세션 만료됨");

    const userId = session[0].user_id;
    const [results] = await db.query("SELECT * FROM goal WHERE user_id = ?", [
      userId,
    ]);

    if (results.length === 0) {
      throw new Error("목표 내역이 없습니다.");
    }

    // 목표에 완료 확률을 계산하여 추가
    const goalsWithProbability = results.map((goal) => {
      const probability = Math.round(
        calculateGoalCompletionProbability(
          parseInt(goal.goal_amount),
          parseInt(goal.current_amount || 0)
        )
      );
      return { ...goal, probability };
    });

    return goalsWithProbability;
  } catch (err) {
    console.error(err);
    throw new Error("서버 오류");
  }
};

// 목표 퍼센트
exports.getGoalPrediction = async (req) => {
  const goalId = req.params.id;
  const [goal] = await db.query("SELECT * FROM goal WHERE id = ?", [goalId]);

  if (goal.length === 0) throw new Error("목표를 찾을 수 없습니다.");

  const probability = Math.random() * 100;
  return { goalId, probability };
};

// 목표 거래내역
exports.getGoalTransactions = async (req) => {
  const goalId = req.params.id;
  const [transactions] = await db.query(
    "SELECT * FROM transaction WHERE goal_id = ?",
    [goalId]
  );
  return transactions;
};

// 목표 달성 금액 트랜잭션
exports.depositGoalAmount = async (req) => {
  const { goal_id, deposit_amount } = req.body;
  const [goal] = await db.query("SELECT * FROM goal WHERE id = ?", [goal_id]);

  if (goal.length === 0) throw new Error("목표를 찾을 수 없습니다.");

  const newAmount = goal[0].current_amount + deposit_amount;

  await db.query("UPDATE goal SET current_amount = ? WHERE id = ?", [
    newAmount,
    goal_id,
  ]);

  await db.query(
    "INSERT INTO transaction (account_id, from_account_number, to_account_number, inout_type, tran_amt, tran_balance_amt, tran_desc) VALUES (?, ?, ?, 'IN', ?, ?, '목표 입금')",
    [
      goal[0].account_id,
      goal[0].account_number,
      goal[0].goal_name,
      deposit_amount,
      newAmount,
    ]
  );

  return { message: "입금 성공", goal_id, deposit_amount };
};
