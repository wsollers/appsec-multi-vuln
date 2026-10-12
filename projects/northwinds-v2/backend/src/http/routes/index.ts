import { Router, type Request } from 'express';
import type { AppConfig } from '../../config/index.js';
import { authenticate } from '../middleware/auth.js';
import { issueCsrfCookie, verifyCsrf } from '../middleware/csrf.js';
import {
  buildCrudRouter,
  boolFilter,
  numberFilter,
  stringFilter,
} from './crudRouter.js';
import { buildOrdersRouter } from './orders.js';
import { buildPublicAuthRouter, buildMeRouter } from './auth.js';
import { buildUtilRouter, buildImportsRouter } from './util.js';
import { NumericIdSchema, CustomerIdSchema } from '../validators/common.js';
import {
  CategoryCreateSchema,
  CategoryUpdateSchema,
  CustomerCreateSchema,
  CustomerUpdateSchema,
  EmployeeCreateSchema,
  EmployeeUpdateSchema,
  ProductCreateSchema,
  ProductUpdateSchema,
  ShipperCreateSchema,
  ShipperUpdateSchema,
  SupplierCreateSchema,
  SupplierUpdateSchema,
} from '../validators/entities.js';
import type {
  Category,
  Customer,
  Employee,
  Product,
  Shipper,
  Supplier,
} from '../../domain/types.js';

export function buildApiRouter(config: AppConfig): Router {
  const api = Router();
  const secure = config.isProduction;

  api.use(issueCsrfCookie(secure));

  api.use('/auth', buildPublicAuthRouter());

  api.get('/health', (_req, res) => res.json({ status: 'ok' }));

  api.use(authenticate);
  api.use(verifyCsrf);

  api.use('/auth', buildMeRouter());

  api.use(
    '/categories',
    buildCrudRouter<Category>({
      resource: 'categories',
      service: (req: Request) => req.ctx.services.categories,
      createSchema: CategoryCreateSchema,
      updateSchema: CategoryUpdateSchema,
      columnMap: { categoryName: 'CategoryName', description: 'Description' },
      idSchema: NumericIdSchema,
      filterMap: { categoryName: { column: 'CategoryName', schema: stringFilter } },
      sortMap: { categoryId: 'CategoryID', categoryName: 'CategoryName' },
    }),
  );

  api.use(
    '/suppliers',
    buildCrudRouter<Supplier>({
      resource: 'suppliers',
      service: (req) => req.ctx.services.suppliers,
      createSchema: SupplierCreateSchema,
      updateSchema: SupplierUpdateSchema,
      columnMap: {
        companyName: 'CompanyName',
        contactName: 'ContactName',
        contactTitle: 'ContactTitle',
        city: 'City',
        country: 'Country',
        phone: 'Phone',
      },
      idSchema: NumericIdSchema,
      filterMap: {
        city: { column: 'City', schema: stringFilter },
        country: { column: 'Country', schema: stringFilter },
      },
      sortMap: { supplierId: 'SupplierID', companyName: 'CompanyName', country: 'Country' },
    }),
  );

  api.use(
    '/products',
    buildCrudRouter<Product>({
      resource: 'products',
      service: (req) => req.ctx.services.products,
      createSchema: ProductCreateSchema,
      updateSchema: ProductUpdateSchema,
      columnMap: {
        productName: 'ProductName',
        supplierId: 'SupplierID',
        categoryId: 'CategoryID',
        unitPrice: 'UnitPrice',
        unitsInStock: 'UnitsInStock',
        discontinued: 'Discontinued',
      },
      idSchema: NumericIdSchema,
      filterMap: {
        categoryId: { column: 'CategoryID', schema: numberFilter },
        supplierId: { column: 'SupplierID', schema: numberFilter },
        discontinued: { column: 'Discontinued', schema: boolFilter },
      },
      sortMap: { productId: 'ProductID', productName: 'ProductName', unitPrice: 'UnitPrice' },
    }),
  );

  api.use(
    '/customers',
    buildCrudRouter<Customer>({
      resource: 'customers',
      service: (req) => req.ctx.services.customers,
      createSchema: CustomerCreateSchema,
      updateSchema: CustomerUpdateSchema,
      columnMap: {
        customerId: 'CustomerID',
        companyName: 'CompanyName',
        contactName: 'ContactName',
        contactTitle: 'ContactTitle',
        city: 'City',
        country: 'Country',
        phone: 'Phone',
      },
      idSchema: CustomerIdSchema,
      filterMap: {
        city: { column: 'City', schema: stringFilter },
        country: { column: 'Country', schema: stringFilter },
      },
      sortMap: { customerId: 'CustomerID', companyName: 'CompanyName', country: 'Country' },
    }),
  );

  api.use(
    '/employees',
    buildCrudRouter<Employee>({
      resource: 'employees',
      service: (req) => req.ctx.services.employees,
      createSchema: EmployeeCreateSchema,
      updateSchema: EmployeeUpdateSchema,
      columnMap: {
        lastName: 'LastName',
        firstName: 'FirstName',
        title: 'Title',
        reportsTo: 'ReportsTo',
        city: 'City',
        country: 'Country',
      },
      idSchema: NumericIdSchema,
      filterMap: { country: { column: 'Country', schema: stringFilter } },
      sortMap: { employeeId: 'EmployeeID', lastName: 'LastName' },
    }),
  );

  api.use(
    '/shippers',
    buildCrudRouter<Shipper>({
      resource: 'shippers',
      service: (req) => req.ctx.services.shippers,
      createSchema: ShipperCreateSchema,
      updateSchema: ShipperUpdateSchema,
      columnMap: { companyName: 'CompanyName', phone: 'Phone' },
      idSchema: NumericIdSchema,
      filterMap: { companyName: { column: 'CompanyName', schema: stringFilter } },
      sortMap: { shipperId: 'ShipperID', companyName: 'CompanyName' },
    }),
  );

  api.use('/orders', buildOrdersRouter());
  api.use('/util', buildUtilRouter());
  api.use('/imports', buildImportsRouter());

  return api;
}
