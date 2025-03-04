const express = require("express");
const session = require("express-session");
const router = express.Router();
const db = require("../db/db");
const schedule = require("node-schedule");

async function executeAutoTransfer(
  fromAccountId,
  toAccountId,
  amount,
  description
) {
  try {
    await db.beginTransaction();

    const [fromAccount] = await db.query(
      "SELECT * FROM account WHERE account_id = ?",
      [fromAccountId]
    );
  } catch (err) {}
}
router.post("/transfer", async (req, res) => {});

module.exports = router;
