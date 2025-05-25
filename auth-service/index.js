const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = "supersecretkey";

// Ruta POST /login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Simulăm autentificare: doar dacă e admin/admin123
  if (username === "admin" && password === "admin123") {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

app.listen(port, () => {
  console.log(`Auth service running on http://localhost:${port}`);
});
