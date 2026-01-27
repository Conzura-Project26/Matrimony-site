import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SarvVivah API Documentation',
      version: '1.0.0',
      description: 'Complete API documentation for SarvVivah matrimonial platform backend',
      contact: {
        name: 'SarvVivah Development Team',
        email: 'dev@sarvvivah.com',
      },
      license: {
        name: 'Private',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://staging.sarvvivah.com',
        description: 'Staging server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'c5735592-9acc-46f8-9644-f55d9660560e',
            },
            full_name: {
              type: 'string',
              example: 'John Doe',
            },
            mobile_number: {
              type: 'string',
              example: '+919876543210',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            gender: {
              type: 'string',
              enum: ['Male', 'Female', 'Other'],
              example: 'Male',
            },
            date_of_birth: {
              type: 'string',
              format: 'date',
              example: '1995-01-15',
            },
            profile_created_by: {
              type: 'string',
              enum: ['Self', 'Parents', 'Guardian', 'Sibling', 'Relative', 'Friend'],
              example: 'Self',
            },
            is_mobile_verified: {
              type: 'boolean',
              example: true,
            },
            is_email_verified: {
              type: 'boolean',
              example: false,
            },
            is_active: {
              type: 'boolean',
              example: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2026-01-27T10:00:00Z',
            },
            role: {
              type: 'object',
              properties: {
                role_name: {
                  type: 'string',
                  example: 'user',
                },
              },
            },
          },
        },
        TokenPair: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token (15 minutes validity)',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              description: 'Refresh token (7 days validity)',
              example: 'a8f5f167f44f4964e6c998dee827110c5028a5a5d8b4e5f5c5d0e6c998dee827110c...',
            },
            expiresIn: {
              type: 'integer',
              description: 'Access token expiry in seconds',
              example: 900,
            },
          },
        },
        Religion: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            religion_name: {
              type: 'string',
              example: 'Hindu',
            },
          },
        },
        Caste: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            caste_name: {
              type: 'string',
              example: 'Brahmin',
            },
            religion_id: {
              type: 'string',
              format: 'uuid',
            },
          },
        },
        SubCaste: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            sub_caste_name: {
              type: 'string',
              example: 'Iyer',
            },
            caste_id: {
              type: 'string',
              format: 'uuid',
            },
          },
        },
        Enums: {
          type: 'object',
          properties: {
            Gender: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['Male', 'Female', 'Other'],
            },
            ProfileCreatedBy: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['Self', 'Parents', 'Guardian', 'Sibling', 'Relative', 'Friend'],
            },
            MaritalStatus: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'],
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and account management endpoints',
      },
      {
        name: 'Master Data',
        description: 'Static reference data (religions, castes, enums)',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
