// Importă frameworkul Express pentru crearea unui server web
const express = require("express");

// Middleware care permite redirecționarea cererilor HTTP către alte servere
const { createProxyMiddleware } = require("http-proxy-middleware");

// Biblioteca folosită pentru generarea și verificarea token-urilor JWT
const jwt = require("jsonwebtoken");

// Încarcă variabilele de mediu din fișierul .env în `process.env`
require("dotenv").config();

// Middleware care permite cereri cross-origin (CORS)
const cors = require("cors");

// Creează o aplicație Express
const app = express();

// Permite cereri de pe alte origini (ex: frontend pe alt port)
app.use(cors());

// Middleware care parsează automat cererile cu body de tip JSON
app.use(express.json());


// ✅ Ruta pentru autentificare (LOGIN)
// Această rută returnează un token JWT dacă utilizatorul trimite credențiale valide
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Exemplu simplu cu user hardcodat. În practică, verifici într-o bază de date.
  if (username === "admin" && password === "admin") {
    // Creează un token JWT semnat cu o cheie secretă și valabil 1 oră
    const token = jwt.sign({ username }, process.env.JWT_SECRET || "secretul-meu", {
      expiresIn: "1h"
    });
    return res.json({ token }); // Returnează tokenul clientului
  }

  // Dacă autentificarea eșuează, trimite eroare 401 (Unauthorized)
  res.status(401).json({ message: "Unauthorized" });
});


// ✅ Middleware pentru protejarea rutelor cu JWT
// Acest cod verifică dacă utilizatorul are un token valid pentru accesul la celelalte rute
app.use((req, res, next) => {
  // Exclude ruta /login de la protecția JWT
  if (req.path === "/login") return next();

  // Extrage tokenul din antetul HTTP "Authorization"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // Dacă tokenul lipsește, întoarce eroare 401
  if (!token) return res.status(401).send("Unauthorized");

  // Verifică validitatea tokenului JWT
  jwt.verify(token, process.env.JWT_SECRET || "secretul-meu", (err, user) => {
    if (err) return res.status(403).send("Forbidden"); // Token invalid sau expirat
    req.user = user; // Salvează datele utilizatorului în request pentru utilizare ulterioară
    next(); // Continuă către următorul middleware sau rută
  });
});


// ✅ Rutare dinamică în funcție de parametri
// Redirecționează cererea către microserviciul corespunzător în funcție de tipul entității (client sau company)
app.get("/:type/:name", (req, res, next) => {
  const { type, name } = req.params;

  // Verifică dacă tipul este valid (client sau company)
  if (type !== "client" && type !== "company") {
    return res.status(400).json({ error: "Tip invalid. Folosește client sau company." });
  }

  // Setează adresa URL pentru proxy (ex: /client/John%20Doe)
  const targetUrl = `/${type}/${name}`;
  req.url = targetUrl;
  next();
}, createProxyMiddleware({
  target: "http://localhost", // local gateway va decide intern
  changeOrigin: true,
  router: {
    "/client": "http://microservice-client:5000",   // Cererile de tip client merg aici
    "/company": "http://microservice-company:6000"  // Cererile de tip company merg aici
  }
}));


// 🔁 Middleware final pentru rutele care nu există
// Dacă niciun alt handler nu a procesat cererea, trimite eroare 404
app.use((req, res) => {
  res.status(404).json({ error: "Resursa nu a fost găsită în API Gateway." });
});


// 🔊 Pornirea serverului Express pe portul 8080
app.listen(8080, () => {
  console.log("✅ API Gateway running on http://localhost:8080");
});
