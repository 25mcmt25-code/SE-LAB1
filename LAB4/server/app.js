const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const studentsRouter = require('./routes/students');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/students', studentsRouter);

// Serve static client files (client/index.html)
const clientPath = path.join(__dirname, '..', 'client');
const clientIndex = path.join(clientPath, 'index.html');
if (fs.existsSync(clientPath) && fs.existsSync(clientIndex)) {
  app.use(express.static(clientPath));
  app.get('*', (req, res) => {
    res.sendFile(clientIndex);
  });
}

module.exports = app;
