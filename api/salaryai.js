const express = require("express");
const session = require("express-session");
const router = express.Router();
const db = require("../db/db");

require("dotenv").config("../.env");
const { Anthropic } = require("@anthropic-ai/sdk");
const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = new Anthropic({
  apiKey: apiKey,
});

async function ConsumptionPattern(transactions) {
  try {
    const transactionSummary = transactions.map((transaction) => {
      return {
        description: transaction.tran_desc,
        time: transaction.transaction_time,
      };
    });

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      temperature: 0.7,
      system: "당신은 사용자의 소비 패턴을 분석하는 도우미입니다..",
      messages: [
        {
          role: "user",
          content: `3개월 간 사용자의 거래내역을 분석하여 소비 패턴을 분석하여 JSON 형식으로만 응답  
          거래내역: ${JSON.stringify(transactionSummary)} 
          응답에 다음 구조를 사용하세요. JSON 형식으로만 응답하시오. 줄바꿈 문자을 넣지 말고, 줄바꿈하지 마시오.
          {
            "consumptionPattern": [
              {
                "name": "음식",
                "ratio": "20%"
              },
              {
                "name": "쇼핑",
                "ratio": "15%"
              }
            ]
          }`,
        },
      ],
    });

    const parsedResponse = JSON.parse(response.content[0].text);

    console.log(parsedResponse);
    return parsedResponse;
  } catch (error) {
    console.error("에러 발생:", error);
  }
}

router.get("/", async (req, res) => {
  // const userId = req.session.userId;
  const userId = 1;

  if (!userId) {
    return res.status(400).send("로그인이 필요합니다.");
  }
  try {
    const [transactions] = await db.query(
      "SELECT * FROM transaction WHERE account_id IN (SELECT account_id FROM account WHERE user_id = ?) AND inout_type = 'OUT'",
      [userId]
    );

    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "거래내역이 없습니다." });
    }

    const analysisResult = await ConsumptionPattern(transactions);
    res.send(analysisResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
