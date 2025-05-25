const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Ruta LOGIN (fără protecție)
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin") {
    const token = jwt.sign({ username }, process.env.JWT_SECRET || "secretul-meu", {
      expiresIn: "1h"
    });
    return res.json({ token });
  }

  res.status(401).json({ message: "Unauthorized" });
});

// ✅ Middleware JWT (pentru toate celelalte rute)
app.use((req, res, next) => {
  if (req.path === "/login") return next();

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).send("Unauthorized");

  jwt.verify(token, process.env.JWT_SECRET || "secretul-meu", (err, user) => {
    if (err) return res.status(403).send("Forbidden");
    req.user = user;
    next();
  });
});

// ✅ Redirecționare dinamică în funcție de tipul căutării
app.get("/:type/:name", (req, res, next) => {
  const { type, name } = req.params;

  if (type !== "client" && type !== "company") {
    return res.status(400).json({ error: "Tip invalid. Folosește client sau company." });
  }

  // Ex: /client/John%20Doe -> proxy la microserviciul potrivit
  const targetUrl = `/${type}/${name}`;
  req.url = targetUrl;
  next();
}, createProxyMiddleware({
  target: "http://localhost", // local gateway va decide intern
  changeOrigin: true,
  router: {
    // Rutare în funcție de tipul cererii
    "/client": "http://microservice-client:5000",
    "/company": "http://microservice-company:6000"
  }
}));

// 🔁 Fallback (în caz că alte rute sunt accesate greșit)
app.use((req, res) => {
  res.status(404).json({ error: "Resursa nu a fost găsită în API Gateway." });
});

app.listen(8080, () => {
  console.log("✅ API Gateway running on http://localhost:8080");
});
