import type { DB } from '../db/connection.js';
import type { Category, Customer, Employee, Product, Shipper, Supplier } from '../domain/types.js';
import { CrudRepository } from './crud.js';
import {
  mapCategory,
  mapCustomer,
  mapEmployee,
  mapProduct,
  mapShipper,
  mapSupplier,
} from './mappers.js';
import { OrdersRepository } from './orders.repository.js';
import { UsersRepository } from './users.repository.js';

export interface Repositories {
  categories: CrudRepository<Category>;
  suppliers: CrudRepository<Supplier>;
  products: CrudRepository<Product>;
  customers: CrudRepository<Customer>;
  employees: CrudRepository<Employee>;
  shippers: CrudRepository<Shipper>;
  orders: OrdersRepository;
  users: UsersRepository;
}

export function createRepositories(db: DB): Repositories {
  return {
    categories: new CrudRepository<Category>(db, {
      table: 'categories',
      pk: 'CategoryID',
      writableColumns: ['CategoryName', 'Description'],
      filterableColumns: ['CategoryName'],
      sortableColumns: ['CategoryID', 'CategoryName'],
      clientSuppliedPk: false,
      map: mapCategory,
    }),
    suppliers: new CrudRepository<Supplier>(db, {
      table: 'suppliers',
      pk: 'SupplierID',
      writableColumns: [
        'CompanyName',
        'ContactName',
        'ContactTitle',
        'City',
        'Country',
        'Phone',
      ],
      filterableColumns: ['CompanyName', 'City', 'Country'],
      sortableColumns: ['SupplierID', 'CompanyName', 'Country'],
      clientSuppliedPk: false,
      map: mapSupplier,
    }),
    products: new CrudRepository<Product>(db, {
      table: 'products',
      pk: 'ProductID',
      writableColumns: [
        'ProductName',
        'SupplierID',
        'CategoryID',
        'UnitPrice',
        'UnitsInStock',
        'Discontinued',
      ],
      filterableColumns: ['CategoryID', 'SupplierID', 'Discontinued'],
      sortableColumns: ['ProductID', 'ProductName', 'UnitPrice'],
      clientSuppliedPk: false,
      map: mapProduct,
    }),
    customers: new CrudRepository<Customer>(db, {
      table: 'customers',
      pk: 'CustomerID',
      writableColumns: [
        'CompanyName',
        'ContactName',
        'ContactTitle',
        'City',
        'Country',
        'Phone',
      ],
      filterableColumns: ['City', 'Country'],
      sortableColumns: ['CustomerID', 'CompanyName', 'Country'],
      clientSuppliedPk: true,
      map: mapCustomer,
    }),
    employees: new CrudRepository<Employee>(db, {
      table: 'employees',
      pk: 'EmployeeID',
      writableColumns: ['LastName', 'FirstName', 'Title', 'ReportsTo', 'City', 'Country'],
      filterableColumns: ['Country', 'ReportsTo'],
      sortableColumns: ['EmployeeID', 'LastName'],
      clientSuppliedPk: false,
      map: mapEmployee,
    }),
    shippers: new CrudRepository<Shipper>(db, {
      table: 'shippers',
      pk: 'ShipperID',
      writableColumns: ['CompanyName', 'Phone'],
      filterableColumns: ['CompanyName'],
      sortableColumns: ['ShipperID', 'CompanyName'],
      clientSuppliedPk: false,
      map: mapShipper,
    }),
    orders: new OrdersRepository(db),
    users: new UsersRepository(db),
  };
}
