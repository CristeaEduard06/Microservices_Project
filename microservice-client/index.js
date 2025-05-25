const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Kafka } = require("kafkajs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Kafka setup
const kafka = new Kafka({
  clientId: "client-service",
  brokers: ["kafka:9092"]
});

// === PRODUCER
const producer = kafka.producer();
producer.connect().catch(console.error);

// === CONSUMER pentru mesaje de la companie
const consumer = kafka.consumer({ groupId: "client-group" });

const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "company-to-client", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log("[Kafka][Client Service] Received from company:", message.value.toString());
    }
  });
};

runConsumer().catch(console.error);

// === Ruta REST corectă: client cere detalii despre el (nu despre companie)
app.get("/client/:name", async (req, res) => {
  const name = req.params.name;

  // Date locale despre clienți
  const clienti = {
    "John Doe": {
      nume: "John Doe",
      functie: "CEO",
      companie: "OpenAI"
    },
    "Jane Smith": {
      nume: "Jane Smith",
      functie: "CTO",
      companie: "Google"
    }
  };

  const client = clienti[name];

  if (client) {
    // 🔁 Trimite mesaj în Kafka
    await producer.send({
      topic: "client-topic",
      messages: [{ value: JSON.stringify(client) }],
    });

    console.log("[Kafka][Client Service] Sent to company:", client);

    // 🔁 Trimite răspuns și înapoi către frontend
    res.json(client);
  } else {
    res.status(404).json({ message: "Clientul nu a fost găsit." });
  }
});

app.listen(5000, () => {
  console.log("Client service running on http://localhost:5000");
});

// === Server gRPC
require('./grpc-server');
