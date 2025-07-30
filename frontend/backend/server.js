const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// دیتابیس موقتی داخل حافظه
let users = [{ id: 1, username: "ali", cards: [] }];

// ورود کاربر
app.post("/api/login", (req, res) => {
  const { username } = req.body;
  let user = users.find(u => u.username === username);
  if (!user) {
    user = { id: users.length + 1, username, cards: [] };
    users.push(user);
  }
  res.json(user);
});

// افزودن کارت
app.post("/api/add-card", (req, res) => {
  const { userId, cardNumber } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const card = { id: Date.now(), number: cardNumber };
  user.cards.push(card);
  res.json(user.cards);
});

// گرفتن کارت‌ها
app.get("/api/cards/:userId", (req, res) => {
  const user = users.find(u => u.id == req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user.cards);
});

app.listen(5000, () => console.log("Backend running on port 5000"));
