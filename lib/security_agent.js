const { internalize, isExternal } = require('@contrast/distringuish');
const { AsyncLocalStorage } = require('async_hooks');
const logger = require('pino')();
const asyncLocalStorage = new AsyncLocalStorage();

const { fork: originalFork } = require('child_process');
const fork = (...args) => {
  const userInput = args[1][0];
  if (isExternal(userInput)) {
    const requestId = asyncLocalStorage.getStore().get('requestId');
    logger.warn({
      message: 'Security violation detected: user input in child_process.fork()',
      requestId,
      userInput,
    });
    internalize(userInput);
  }

  return originalFork(...args);
};

require('child_process').fork = fork;

module.exports = { asyncLocalStorage };
