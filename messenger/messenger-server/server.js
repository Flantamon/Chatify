require('dotenv').config();
const express = require('express');
const http = require('http');
const setup = require('./app');
const { setupWss } = require('./wss');
const app = express();
const server = http.createServer(app);

setup(app);

setupWss(server);

// Запуск сервера
server.listen(3001, () => {
  console.log('Server is running on http://localhost:3001');
});