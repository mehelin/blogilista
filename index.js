const app = require('./app'); // varsinainen Express-sovellus
const http = require('http');
const config = require('./utils/config'); // sovelluksen muut osat pääsevät y.muuttujiin
const logger = require('./utils/logger');

const server = http.createServer(app);

server.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`); // sovelluksen muut osat pääsevät y.muuttujiin
});
