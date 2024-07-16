const logger = require('pino')();

require('./app').listen(3000, () => {
  logger.info('Server running on port 3000');
});
