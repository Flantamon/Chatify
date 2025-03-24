const WebSocket = require('ws');

let wss;

function setupWss(server) {
  wss = new WebSocket.Server({ server });

  // Обработка подключения WebSocket
  wss.on('connection', (ws) => {
    console.log('New client connected');

    // Обработка отключения клиента
    ws.on('close', () => {
      console.log('Client disconnected');
    });

    // Обработка сообщений от клиента (если необходимо)
    ws.on('message', (message) => {
      console.log(`Received message: ${message}`);
      // Здесь можно добавить логику для обработки сообщений от клиента
    });
  });
}

// Функция для отправки сообщения всем подключенным клиентам
const broadcastMessage = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

module.exports = {
  wss,
  broadcastMessage,
  setupWss,
};
