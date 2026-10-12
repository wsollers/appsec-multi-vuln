import type { Repositories } from '../repositories/index.js';
import type { Category, Customer, Employee, Product, Shipper, Supplier } from '../domain/types.js';
import { EntityService } from './entity.service.js';
import { OrdersService } from './orders.service.js';

export interface Services {
  categories: EntityService<Category>;
  suppliers: EntityService<Supplier>;
  products: EntityService<Product>;
  customers: EntityService<Customer>;
  employees: EntityService<Employee>;
  shippers: EntityService<Shipper>;
  orders: OrdersService;
}

export function createServices(repos: Repositories): Services {
  return {
    categories: new EntityService(repos.categories, 'Category'),
    suppliers: new EntityService(repos.suppliers, 'Supplier'),
    products: new EntityService(repos.products, 'Product'),
    customers: new EntityService(repos.customers, 'Customer'),
    employees: new EntityService(repos.employees, 'Employee'),
    shippers: new EntityService(repos.shippers, 'Shipper'),
    orders: new OrdersService(repos.orders),
  };
}
