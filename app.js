const express = require('express');
const { asyncLocalStorage } = require('./lib/security_agent');
const { externalize } = require('@contrast/distringuish');
const { fork } = require('child_process');
const logger = require('pino')();
const pinoHttp = require('pino-http');

const app = express();
app.use(express.json());
app.use(pinoHttp({ logger }));

app.post('/execute', (req, res) => {
  try {
    const userInput = JSON.stringify(req.body);
    const requestId = Date.now().toString();

    const trackedInput = externalize(userInput);
    asyncLocalStorage.run(new Map(), () => {

      asyncLocalStorage.getStore().set('requestId', requestId);
      asyncLocalStorage.getStore().set('userInput', trackedInput);

      const child = fork('./lib/child.js', [trackedInput]);
      child.send(trackedInput);
      child.on('message', (message) => {
        res.json({ message, requestId });
      });

      child.on('error', (err) => {
        res.status(500).json({ error: err.message, requestId });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message, requestId });
  }
});

module.exports = app;
