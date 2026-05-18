export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'EduMetric API',
    version: '0.1.0',
    description: 'PDP University grant CRM API. Integration endpoints require X-API-Key header.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        summary: 'Login',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } }, required: ['email', 'password'] } } },
        },
        responses: { '200': { description: 'OK' }, '401': { description: 'Invalid credentials' } },
      },
    },
    '/auth/me': {
      get: { summary: 'Current user', security: [{ bearerAuth: [] }], responses: { '200': { description: 'OK' } } },
    },
    '/public/rating': {
      get: { summary: 'Public rating (no auth)', parameters: [{ in: 'query', name: 'groupId', schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/integrations/attendance': {
      post: {
        summary: 'Bulk attendance from external system',
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  records: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        studentId: { type: 'string', format: 'uuid' },
                        date: { type: 'string', format: 'date-time' },
                        status: { type: 'string', enum: ['PRESENT', 'ABSENT', 'EXCUSED'] },
                      },
                      required: ['studentId', 'date', 'status'],
                    },
                  },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'OK' } },
      },
    },
    '/integrations/grades': {
      post: {
        summary: 'Bulk grades from external system',
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  records: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        studentId: { type: 'string', format: 'uuid' },
                        gpa: { type: 'number', minimum: 0, maximum: 100 },
                        projectScore: { type: 'number', minimum: 0, maximum: 15 },
                      },
                      required: ['studentId'],
                    },
                  },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'OK' } },
      },
    },
  },
};
