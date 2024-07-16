process.on('message', (message) => {
  process.send(`Received: ${message}`);
});
