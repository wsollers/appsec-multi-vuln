/**
 * OpenAPI 3.0 description of the REST surface (design §5.3). Served via Swagger
 * UI in non-production. Kept in code so it stays in step with the routes.
 */

type OpenAPIObject = Record<string, unknown>;

const errorEnvelope = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['code', 'message'],
    },
  },
};

const pageInfo = (itemsRef: string) => ({
  type: 'object',
  properties: {
    items: { type: 'array', items: { $ref: itemsRef } },
    page: { type: 'integer' },
    pageSize: { type: 'integer' },
    total: { type: 'integer' },
  },
});

const standardResponses = {
  '400': { description: 'Validation error', content: json('#/components/schemas/Error') },
  '401': { description: 'Unauthenticated', content: json('#/components/schemas/Error') },
  '403': { description: 'Forbidden', content: json('#/components/schemas/Error') },
  '404': { description: 'Not found', content: json('#/components/schemas/Error') },
};

function json(ref: string) {
  return { 'application/json': { schema: { $ref: ref } } };
}

function crudPaths(resource: string, schemaRef: string, idType: 'integer' | 'string') {
  const tag = resource;
  const idParam = {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: idType },
  };
  return {
    [`/api/v1/${resource}`]: {
      get: {
        tags: [tag],
        summary: `List ${resource}`,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 25, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Paged list',
            content: json(`${schemaRef}Page`),
          },
          ...standardResponses,
        },
      },
      post: {
        tags: [tag],
        summary: `Create ${resource}`,
        requestBody: { required: true, content: json(`${schemaRef}Input`) },
        responses: {
          '201': { description: 'Created', content: json(schemaRef) },
          ...standardResponses,
        },
      },
    },
    [`/api/v1/${resource}/{id}`]: {
      get: {
        tags: [tag],
        summary: `Get ${resource} by id`,
        parameters: [idParam],
        responses: { '200': { description: 'Found', content: json(schemaRef) }, ...standardResponses },
      },
      put: {
        tags: [tag],
        summary: `Update ${resource}`,
        parameters: [idParam],
        requestBody: { required: true, content: json(`${schemaRef}Input`) },
        responses: { '200': { description: 'Updated', content: json(schemaRef) }, ...standardResponses },
      },
      delete: {
        tags: [tag],
        summary: `Delete ${resource}`,
        parameters: [idParam],
        responses: { '204': { description: 'Deleted' }, ...standardResponses },
      },
    },
  };
}

export function buildOpenApiDocument(serverUrl: string): OpenAPIObject {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Northwind Secure API',
      version: '1.0.0',
      description:
        'Secure reference Northwind CRUD API. All endpoints under /api/v1 (except /health, /auth/csrf-token, /auth/dev/token) require a Bearer RS256 JWT. State-changing requests additionally require the X-CSRF-Token header (double-submit cookie).',
    },
    servers: [{ url: serverUrl }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: errorEnvelope,
        Category: {
          type: 'object',
          properties: {
            categoryId: { type: 'integer' },
            categoryName: { type: 'string' },
            description: { type: 'string', nullable: true },
          },
        },
        CategoryInput: {
          type: 'object',
          required: ['categoryName'],
          properties: {
            categoryName: { type: 'string' },
            description: { type: 'string', nullable: true },
          },
        },
        CategoryPage: pageInfo('#/components/schemas/Category'),
        Product: {
          type: 'object',
          properties: {
            productId: { type: 'integer' },
            productName: { type: 'string' },
            supplierId: { type: 'integer', nullable: true },
            categoryId: { type: 'integer', nullable: true },
            unitPrice: { type: 'number' },
            unitsInStock: { type: 'integer' },
            discontinued: { type: 'boolean' },
          },
        },
        ProductInput: {
          type: 'object',
          required: ['productName'],
          properties: {
            productName: { type: 'string' },
            supplierId: { type: 'integer', nullable: true },
            categoryId: { type: 'integer', nullable: true },
            unitPrice: { type: 'number' },
            unitsInStock: { type: 'integer' },
            discontinued: { type: 'boolean' },
          },
        },
        ProductPage: pageInfo('#/components/schemas/Product'),
        Customer: {
          type: 'object',
          properties: {
            customerId: { type: 'string' },
            companyName: { type: 'string' },
            contactName: { type: 'string', nullable: true },
            contactTitle: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            country: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
          },
        },
        CustomerInput: {
          type: 'object',
          required: ['customerId', 'companyName'],
          properties: {
            customerId: { type: 'string', pattern: '^[A-Z]{5}$' },
            companyName: { type: 'string' },
            contactName: { type: 'string', nullable: true },
            contactTitle: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            country: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
          },
        },
        CustomerPage: pageInfo('#/components/schemas/Customer'),
        Supplier: {
          type: 'object',
          properties: {
            supplierId: { type: 'integer' },
            companyName: { type: 'string' },
            contactName: { type: 'string', nullable: true },
            contactTitle: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            country: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
          },
        },
        SupplierInput: {
          type: 'object',
          required: ['companyName'],
          properties: {
            companyName: { type: 'string' },
            contactName: { type: 'string', nullable: true },
            contactTitle: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            country: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
          },
        },
        SupplierPage: pageInfo('#/components/schemas/Supplier'),
        Employee: {
          type: 'object',
          properties: {
            employeeId: { type: 'integer' },
            lastName: { type: 'string' },
            firstName: { type: 'string' },
            title: { type: 'string', nullable: true },
            reportsTo: { type: 'integer', nullable: true },
            city: { type: 'string', nullable: true },
            country: { type: 'string', nullable: true },
          },
        },
        EmployeeInput: {
          type: 'object',
          required: ['lastName', 'firstName'],
          properties: {
            lastName: { type: 'string' },
            firstName: { type: 'string' },
            title: { type: 'string', nullable: true },
            reportsTo: { type: 'integer', nullable: true },
            city: { type: 'string', nullable: true },
            country: { type: 'string', nullable: true },
          },
        },
        EmployeePage: pageInfo('#/components/schemas/Employee'),
        Shipper: {
          type: 'object',
          properties: {
            shipperId: { type: 'integer' },
            companyName: { type: 'string' },
            phone: { type: 'string', nullable: true },
          },
        },
        ShipperInput: {
          type: 'object',
          required: ['companyName'],
          properties: {
            companyName: { type: 'string' },
            phone: { type: 'string', nullable: true },
          },
        },
        ShipperPage: pageInfo('#/components/schemas/Shipper'),
        OrderDetail: {
          type: 'object',
          properties: {
            orderId: { type: 'integer' },
            productId: { type: 'integer' },
            unitPrice: { type: 'number' },
            quantity: { type: 'integer' },
            discount: { type: 'number' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            orderId: { type: 'integer' },
            customerId: { type: 'string', nullable: true },
            employeeId: { type: 'integer', nullable: true },
            orderDate: { type: 'string', nullable: true },
            requiredDate: { type: 'string', nullable: true },
            shippedDate: { type: 'string', nullable: true },
            shipVia: { type: 'integer', nullable: true },
            freight: { type: 'number' },
            shipName: { type: 'string', nullable: true },
            shipCity: { type: 'string', nullable: true },
            shipCountry: { type: 'string', nullable: true },
          },
        },
        OrderInput: {
          type: 'object',
          required: ['details'],
          properties: {
            customerId: { type: 'string', nullable: true },
            employeeId: { type: 'integer', nullable: true },
            orderDate: { type: 'string', nullable: true },
            requiredDate: { type: 'string', nullable: true },
            shippedDate: { type: 'string', nullable: true },
            shipVia: { type: 'integer', nullable: true },
            freight: { type: 'number' },
            shipName: { type: 'string', nullable: true },
            shipCity: { type: 'string', nullable: true },
            shipCountry: { type: 'string', nullable: true },
            details: {
              type: 'array',
              items: {
                type: 'object',
                required: ['productId', 'unitPrice', 'quantity'],
                properties: {
                  productId: { type: 'integer' },
                  unitPrice: { type: 'number' },
                  quantity: { type: 'integer' },
                  discount: { type: 'number' },
                },
              },
            },
          },
        },
        OrderPage: pageInfo('#/components/schemas/Order'),
        TokenResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            tokenType: { type: 'string' },
            expiresIn: { type: 'integer' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/api/v1/health': {
        get: {
          tags: ['meta'],
          security: [],
          summary: 'Liveness check',
          responses: { '200': { description: 'OK' } },
        },
      },
      '/api/v1/auth/csrf-token': {
        get: {
          tags: ['auth'],
          security: [],
          summary: 'Fetch the anti-CSRF token (also sets the csrf_token cookie)',
          responses: { '200': { description: 'Token' } },
        },
      },
      '/api/v1/auth/dev/token': {
        post: {
          tags: ['auth'],
          security: [],
          summary: 'DEV/TEST ONLY: mint an access token for a seeded user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username'],
                  properties: { username: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Token', content: json('#/components/schemas/TokenResponse') },
            '404': { description: 'Disabled in production' },
          },
        },
      },
      '/api/v1/auth/me': {
        get: {
          tags: ['auth'],
          summary: 'The authenticated principal',
          responses: { '200': { description: 'User' }, '401': { description: 'Unauthenticated' } },
        },
      },
      ...crudPaths('categories', '#/components/schemas/Category', 'integer'),
      ...crudPaths('suppliers', '#/components/schemas/Supplier', 'integer'),
      ...crudPaths('products', '#/components/schemas/Product', 'integer'),
      ...crudPaths('customers', '#/components/schemas/Customer', 'string'),
      ...crudPaths('employees', '#/components/schemas/Employee', 'integer'),
      ...crudPaths('shippers', '#/components/schemas/Shipper', 'integer'),
      '/api/v1/orders': {
        get: {
          tags: ['orders'],
          summary: 'List orders (object-level scoped for sales users)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 25 } },
            { name: 'customerId', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Paged orders', content: json('#/components/schemas/OrderPage') },
            ...standardResponses,
          },
        },
        post: {
          tags: ['orders'],
          summary: 'Create an order with line items (transactional)',
          requestBody: { required: true, content: json('#/components/schemas/OrderInput') },
          responses: {
            '201': { description: 'Created', content: json('#/components/schemas/Order') },
            ...standardResponses,
          },
        },
      },
      '/api/v1/orders/{id}': {
        get: {
          tags: ['orders'],
          summary: 'Get an order (object-level authorized)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            '200': { description: 'Order with details' },
            ...standardResponses,
          },
        },
        put: {
          tags: ['orders'],
          summary: 'Update an order (object-level authorized)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: json('#/components/schemas/OrderInput') },
          responses: { '200': { description: 'Updated' }, ...standardResponses },
        },
        delete: {
          tags: ['orders'],
          summary: 'Delete an order (object-level authorized)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '204': { description: 'Deleted' }, ...standardResponses },
        },
      },
      '/api/v1/util/fetch-preview': {
        post: {
          tags: ['util'],
          summary: 'Admin-only SSRF-guarded outbound fetch preview',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['url'],
                  properties: { url: { type: 'string', format: 'uri' } },
                },
              },
            },
          },
          responses: { '200': { description: 'Preview' }, ...standardResponses },
        },
      },
    },
  };
}
