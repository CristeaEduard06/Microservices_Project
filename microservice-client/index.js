// ✅ Importă frameworkul Express pentru a crea un server web
const express = require("express");

// ✅ Axios este folosit pentru a face cereri HTTP către alte servicii
const axios = require("axios");

// ✅ Middleware pentru a putea interpreta datele JSON din body-ul cererilor
const bodyParser = require("body-parser");

// ✅ Permite cereri din alte origini (ex: frontend separat)
const cors = require("cors");

// ✅ KafkaJS este o bibliotecă pentru a lucra cu Apache Kafka din Node.js
const { Kafka } = require("kafkajs");

// ✅ Inițializăm aplicația Express
const app = express();

// ✅ Activăm CORS pentru a permite comunicarea cu frontend-ul
app.use(cors());

// ✅ Activăm parsarea automată a cererilor JSON
app.use(bodyParser.json());


// === 🔌 Configurare Kafka ===

// ✅ Creăm o instanță Kafka specificând ID-ul clientului și brokerul (adresa clusterului Kafka)
const kafka = new Kafka({
  clientId: "client-service", // identifică acest microserviciu
  brokers: ["kafka:9092"]     // adresa brokerului Kafka (în Docker, serviciul se numește "kafka")
});


// === 📨 PRODUCER ===
// ✅ Creează un "producer" Kafka pentru a trimite mesaje către alte servicii
const producer = kafka.producer();

// ✅ Conectează producerul la Kafka
producer.connect().catch(console.error);


// === 📥 CONSUMER ===
// ✅ Creează un "consumer" Kafka care ascultă mesajele venite de la companie
const consumer = kafka.consumer({ groupId: "client-group" });

// ✅ Funcție asincronă pentru configurarea consumerului
const runConsumer = async () => {
  await consumer.connect(); // Se conectează la Kafka
  await consumer.subscribe({ topic: "company-to-client", fromBeginning: true }); // Ascultă topicul

  // ✅ Se execută când vine un mesaj
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log("[Kafka][Client Service] Received from company:", message.value.toString());
    }
  });
};

// ✅ Pornim consumer-ul
runConsumer().catch(console.error);


// === 📡 RUTĂ PRINCIPALĂ: returnează detalii despre client ===
// Ruta este accesată de frontend pentru a cere informații despre un client
app.get("/client/:name", async (req, res) => {
  const name = req.params.name;

  // ✅ Datele clienților sunt stocate local, hardcodate pentru exemplu
  const clienti = {
    "John Doe": {
      nume: "John Doe",
      functie: "Manager",
      companie: "OpenAI"
    },
    "Jane Smith": {
      nume: "Jane Smith",
      functie: "CTO",
      companie: "Google"
    }
  };

  // ✅ Caută clientul în "baza de date" locală
  const client = clienti[name];

  if (client) {
    // ✅ Trimite informațiile clientului către Kafka pentru a fi preluate de alt microserviciu
    await producer.send({
      topic: "client-topic", // Topic-ul unde se trimit datele clientului
      messages: [{ value: JSON.stringify(client) }],
    });

    console.log("[Kafka][Client Service] Sent to company:", client);

    // ✅ Trimite răspunsul înapoi către frontend
    res.json(client);
  } else {
    // ✅ Clientul nu a fost găsit în lista locală
    res.status(404).json({ message: "Clientul nu a fost găsit." });
  }
});


// === 🚀 PORNIREA SERVERULUI ===
// Serverul ascultă cereri HTTP pe portul 5000
app.listen(5000, () => {
  console.log("Client service running on http://localhost:5000");
});


// === 🛰️ Inițializează serverul gRPC local pentru comunicare internă între microservicii ===
require('./grpc-server');
