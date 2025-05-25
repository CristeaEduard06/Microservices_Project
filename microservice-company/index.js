const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Kafka } = require('kafkajs');
const { getClientInfo } = require('./grpc-client');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = 6000;

// 🔁 Date companii mock
const companies = [
  { name: "John Doe", company: "OpenAI", position: "CEO" },
  { name: "Jane Smith", company: "TechCorp", position: "CTO" },
  { name: "Maria Popescu", company: "FutureSoft", position: "Manager" }
];

// REST: returnează companie după nume
app.get('/company/:name', (req, res) => {
  const name = req.params.name;
  const found = companies.find(c => c.company.toLowerCase() === name.toLowerCase());

  if (found) {
    res.json(found);
  } else {
    res.status(404).json({ message: "Compania nu a fost găsită." });
  }
});

// gRPC: trimite request către client
app.get('/company/client/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const data = await getClientInfo(name);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message || 'gRPC error' });
  }
});

// Test route
app.get('/company', (req, res) => {
  res.json({ message: 'Company service working' });
});

// === Kafka config
const kafka = new Kafka({
  clientId: 'company-service',
  brokers: ['kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'company-group' });
const producer = kafka.producer();

// Primește mesaje de la client
const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'client-topic', fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`[Kafka][Company Service] Received: ${message.value.toString()}`);
    },
  });
};

runConsumer().catch(console.error);

// Trimite mesaje către client
const sendMessageToClient = async (payload) => {
  await producer.connect();
  await producer.send({
    topic: 'company-to-client',
    messages: [{ value: JSON.stringify(payload) }],
  });
  console.log('[Kafka][Company Service] Sent to client:', payload);
};

// ✅ Aceasta este ruta pe care o testezi în Hoppscotch
app.get('/send-to-client', async (req, res) => {
  const testData = {
    name: 'CompanyBot',
    message: 'Mesaj de test trimis de companie către client 🎯'
  };

  try {
    await sendMessageToClient(testData);
    res.json({ status: 'Mesaj trimis către client.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Eroare la trimiterea mesajului Kafka' });
  }
});

// PORNEȘTE serverul
app.listen(PORT, () => {
  console.log(`Company service running on http://localhost:${PORT}`);
});