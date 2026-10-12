import type { DB } from './connection.js';
import { openDatabase } from './connection.js';
import { loadConfig } from '../config/index.js';
import { runMigrations } from './migrate.js';

/**
 * Seeds a representative subset of the classic Northwind dataset plus the
 * application users used for authz. Idempotent: clears the business tables
 * first so re-seeding yields a deterministic state. All inserts are
 * parameterized.
 */
export function seedDatabase(db: DB): void {
  const seed = db.transaction(() => {
    // Clear in FK-safe order.
    for (const t of [
      'order_details',
      'orders',
      'products',
      'app_users',
      'employees',
      'suppliers',
      'customers',
      'shippers',
      'categories',
    ]) {
      db.exec(`DELETE FROM ${t};`);
    }

    const categories: [number, string, string][] = [
      [1, 'Beverages', 'Soft drinks, coffees, teas, beers, and ales'],
      [2, 'Condiments', 'Sweet and savory sauces, relishes, spreads, and seasonings'],
      [3, 'Confections', 'Desserts, candies, and sweet breads'],
      [4, 'Dairy Products', 'Cheeses'],
      [5, 'Grains/Cereals', 'Breads, crackers, pasta, and cereal'],
      [6, 'Meat/Poultry', 'Prepared meats'],
      [7, 'Produce', 'Dried fruit and bean curd'],
      [8, 'Seafood', 'Seaweed and fish'],
    ];
    const insCategory = db.prepare(
      'INSERT INTO categories (CategoryID, CategoryName, Description) VALUES (?, ?, ?)',
    );
    for (const c of categories) insCategory.run(...c);

    const suppliers: [number, string, string, string, string, string, string][] = [
      [1, 'Exotic Liquids', 'Charlotte Cooper', 'Purchasing Manager', 'London', 'UK', '(171) 555-2222'],
      [2, 'New Orleans Cajun Delights', 'Shelley Burke', 'Order Administrator', 'New Orleans', 'USA', '(100) 555-4822'],
      [3, 'Grandma Kellys Homestead', 'Regina Murphy', 'Sales Representative', 'Ann Arbor', 'USA', '(313) 555-5735'],
      [4, 'Tokyo Traders', 'Yoshi Nagase', 'Marketing Manager', 'Tokyo', 'Japan', '(03) 3555-5011'],
      [5, 'Cooperativa de Quesos', 'Antonio del Valle', 'Export Administrator', 'Oviedo', 'Spain', '(98) 598 76 54'],
    ];
    const insSupplier = db.prepare(
      'INSERT INTO suppliers (SupplierID, CompanyName, ContactName, ContactTitle, City, Country, Phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    for (const s of suppliers) insSupplier.run(...s);

    const shippers: [number, string, string][] = [
      [1, 'Speedy Express', '(503) 555-9831'],
      [2, 'United Package', '(503) 555-3199'],
      [3, 'Federal Shipping', '(503) 555-9931'],
    ];
    const insShipper = db.prepare(
      'INSERT INTO shippers (ShipperID, CompanyName, Phone) VALUES (?, ?, ?)',
    );
    for (const s of shippers) insShipper.run(...s);

    // Managers are inserted before their reports so the ReportsTo FK holds.
    const employees: [number, string, string, string, number | null, string, string][] = [
      [2, 'Fuller', 'Andrew', 'Vice President, Sales', null, 'Tacoma', 'USA'],
      [1, 'Davolio', 'Nancy', 'Sales Representative', 2, 'Seattle', 'USA'],
      [3, 'Leverling', 'Janet', 'Sales Representative', 2, 'Kirkland', 'USA'],
      [4, 'Peacock', 'Margaret', 'Sales Representative', 2, 'Redmond', 'USA'],
    ];
    const insEmployee = db.prepare(
      'INSERT INTO employees (EmployeeID, LastName, FirstName, Title, ReportsTo, City, Country) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    for (const e of employees) insEmployee.run(...e);

    const customers: [string, string, string, string, string, string, string][] = [
      ['ALFKI', 'Alfreds Futterkiste', 'Maria Anders', 'Sales Representative', 'Berlin', 'Germany', '030-0074321'],
      ['ANATR', 'Ana Trujillo Emparedados', 'Ana Trujillo', 'Owner', 'Mexico D.F.', 'Mexico', '(5) 555-4729'],
      ['AROUT', 'Around the Horn', 'Thomas Hardy', 'Sales Representative', 'London', 'UK', '(171) 555-7788'],
      ['BERGS', 'Berglunds snabbkop', 'Christina Berglund', 'Order Administrator', 'Lulea', 'Sweden', '0921-12 34 65'],
      ['BLONP', 'Blondesddsl pere et fils', 'Frederique Citeaux', 'Marketing Manager', 'Strasbourg', 'France', '88.60.15.31'],
    ];
    const insCustomer = db.prepare(
      'INSERT INTO customers (CustomerID, CompanyName, ContactName, ContactTitle, City, Country, Phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    for (const c of customers) insCustomer.run(...c);

    const products: [number, string, number, number, number, number, number][] = [
      [1, 'Chai', 1, 1, 18.0, 39, 0],
      [2, 'Chang', 1, 1, 19.0, 17, 0],
      [3, 'Aniseed Syrup', 1, 2, 10.0, 13, 0],
      [4, 'Chef Antons Cajun Seasoning', 2, 2, 22.0, 53, 0],
      [5, 'Chef Antons Gumbo Mix', 2, 2, 21.35, 0, 1],
      [6, 'Grandmas Boysenberry Spread', 3, 2, 25.0, 120, 0],
      [7, 'Uncle Bobs Organic Dried Pears', 3, 7, 30.0, 15, 0],
      [8, 'Northwoods Cranberry Sauce', 3, 2, 40.0, 6, 0],
      [9, 'Mishi Kobe Niku', 4, 6, 97.0, 29, 1],
      [10, 'Ikura', 4, 8, 31.0, 31, 0],
      [11, 'Queso Cabrales', 5, 4, 21.0, 22, 0],
      [12, 'Queso Manchego La Pastora', 5, 4, 38.0, 86, 0],
    ];
    const insProduct = db.prepare(
      'INSERT INTO products (ProductID, ProductName, SupplierID, CategoryID, UnitPrice, UnitsInStock, Discontinued) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    for (const p of products) insProduct.run(...p);

    const orders: [number, string, number, string, string, string | null, number, number, string, string, string][] = [
      [10248, 'ALFKI', 1, '2023-07-04', '2023-08-01', '2023-07-16', 3, 32.38, 'Alfreds Futterkiste', 'Berlin', 'Germany'],
      [10249, 'ANATR', 3, '2023-07-05', '2023-08-16', '2023-07-10', 1, 11.61, 'Ana Trujillo', 'Mexico D.F.', 'Mexico'],
      [10250, 'AROUT', 4, '2023-07-08', '2023-08-05', '2023-07-12', 2, 65.83, 'Around the Horn', 'London', 'UK'],
      [10251, 'BERGS', 1, '2023-07-08', '2023-08-05', '2023-07-15', 1, 41.34, 'Berglunds snabbkop', 'Lulea', 'Sweden'],
      [10252, 'BLONP', 4, '2023-07-09', '2023-08-06', null, 2, 51.3, 'Blondesddsl', 'Strasbourg', 'France'],
    ];
    const insOrder = db.prepare(
      'INSERT INTO orders (OrderID, CustomerID, EmployeeID, OrderDate, RequiredDate, ShippedDate, ShipVia, Freight, ShipName, ShipCity, ShipCountry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );
    for (const o of orders) insOrder.run(...o);

    const details: [number, number, number, number, number][] = [
      [10248, 1, 18.0, 12, 0],
      [10248, 2, 19.0, 10, 0],
      [10249, 3, 10.0, 9, 0],
      [10250, 4, 22.0, 35, 0.15],
      [10250, 7, 30.0, 15, 0.15],
      [10251, 6, 25.0, 6, 0.05],
      [10252, 11, 21.0, 40, 0],
      [10252, 12, 38.0, 25, 0.05],
    ];
    const insDetail = db.prepare(
      'INSERT INTO order_details (OrderID, ProductID, UnitPrice, Quantity, Discount) VALUES (?, ?, ?, ?, ?)',
    );
    for (const d of details) insDetail.run(...d);

    // Application users (subjects an IdP would assert). No secrets stored here.
    const users: [string, string, string, number | null][] = [
      ['user-admin', 'admin', 'admin', null],
      ['user-alice', 'sales_alice', 'sales', 1],
      ['user-bob', 'sales_bob', 'sales', 3],
      ['user-viewer', 'viewer', 'viewer', null],
    ];
    const insUser = db.prepare(
      'INSERT INTO app_users (Sub, Username, Roles, EmployeeID) VALUES (?, ?, ?, ?)',
    );
    for (const u of users) insUser.run(...u);
  });

  seed();
}

// CLI entry point: `npm run seed`.
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadConfig();
  const db = openDatabase(config.databasePath);
  runMigrations(db);
  seedDatabase(db);
  db.close();
  console.log('Database seeded with the Northwind sample dataset.');
}
