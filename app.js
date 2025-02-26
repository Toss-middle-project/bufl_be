const express = require("express");
const cors = require("cors");
const db = require("./db/db"); // DB 설정 파일
const joinRouter = require("./api/join"); // 회원가입 라우터

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/users", joinRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
