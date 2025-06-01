// ✅ Express este un framework Node.js pentru crearea serverelor web
const express = require('express');

// ✅ Permite citirea datelor din body-ul cererilor HTTP (JSON, etc.)
const bodyParser = require('body-parser');

// ✅ Middleware care permite cereri cross-origin (util când frontend-ul e pe alt port)
const cors = require('cors');

// ✅ KafkaJS este folosit pentru comunicarea asincronă între microservicii
const { Kafka } = require('kafkajs');

// ✅ Funcție gRPC locală, folosită pentru a obține date despre un client
const { getClientInfo } = require('./grpc-client');

// ✅ Inițializează aplicația Express
const app = express();

// ✅ Permite serverului să înțeleagă corpul cererilor în format JSON
app.use(bodyParser.json());

// ✅ Activează CORS pentru a permite cereri de la alte surse (ex: frontend)
app.use(cors());

const PORT = 6000; // Portul pe care rulează serviciul companiei

// 🔁 Date companii mock
// ===================== 🔎 MOCK DATA ======================

// ✅ Simulează o "bază de date" locală cu companii
const companies = [
  { name: "John Doe", company: "OpenAI", position: "CTO" },
  { name: "Jane Smith", company: "TechCorp", position: "CTO" },
  { name: "Maria Popescu", company: "FutureSoft", position: "Manager" }
];


// ===================== 🌐 ENDPOINTURI REST ======================

// ✅ Returnează informații despre o companie în funcție de nume (căutare după câmpul "company")
app.get('/company/:name', (req, res) => {
  const name = req.params.name;

  // Caută compania în lista locală ignorând majusculele
  const found = companies.find(c => c.company.toLowerCase() === name.toLowerCase());

  if (found) {
    res.json(found); // Trimite detaliile companiei găsite
  } else {
    res.status(404).json({ message: "Compania nu a fost găsită." });
  }
});


// ✅ Apelează serviciul gRPC pentru a obține informații despre un client
app.get('/company/client/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const data = await getClientInfo(name); // Apelează funcția gRPC
    res.json(data); // Trimite datele clientului ca răspuns
  } catch (error) {
    res.status(500).json({ message: error.message || 'gRPC error' }); // Eroare în apelul gRPC
  }
});


// ✅ RUTĂ DE TEST: confirmă că serviciul companiei funcționează
app.get('/company', (req, res) => {
  res.json({ message: 'Company service working' });
});


// ===================== ⚙️ CONFIG KAFKA ======================

// ✅ Configurare Kafka pentru microserviciul companiei
const kafka = new Kafka({
  clientId: 'company-service', // ID-ul cu care Kafka identifică acest serviciu
  brokers: ['kafka:9092']      // Brokerul Kafka (adresa containerului Kafka)
});

// ✅ Consumerul va asculta mesaje de la client
const consumer = kafka.consumer({ groupId: 'company-group' });

// ✅ Producerul va trimite mesaje către client
const producer = kafka.producer();


// ✅ CONSUMER — ascultă mesaje primite de la client
const runConsumer = async () => {
  await consumer.connect(); // Conectează consumerul la Kafka
  await consumer.subscribe({ topic: 'client-topic', fromBeginning: true }); // Ascultă topic-ul

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      // ✅ Afișează mesajul primit în consolă
      console.log(`[Kafka][Company Service] Received: ${message.value.toString()}`);
    },
  });
};

runConsumer().catch(console.error); // Pornim consumer-ul


// ✅ PRODUCER — trimite mesaje către client prin Kafka
const sendMessageToClient = async (payload) => {
  await producer.connect(); // Conectează producerul
  await producer.send({
    topic: 'company-to-client', // Trimite către acest topic
    messages: [{ value: JSON.stringify(payload) }], // Payload-ul trebuie să fie stringificat
  });

  console.log('[Kafka][Company Service] Sent to client:', payload);
};


// ✅ Ruta specială pentru testarea trimiterea de mesaje către client prin Kafka
// Poți testa această rută din Hoppscotch sau Postman
app.get('/send-to-client', async (req, res) => {
  // ✅ Exemplu de mesaj trimis de companie
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


// ✅ PORNEȘTE SERVERUL pe portul specificat
app.listen(PORT, () => {
  console.log(`Company service running on http://localhost:${PORT}`);
});