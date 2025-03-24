const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Messenger API',
      version: '1.0.0',
      description: 'Документация API для мессенджера',
    },
  },
  apis: ['./routes/*.js'], // Путь к файлам с аннотациями
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = { swaggerUi, swaggerDocs };
