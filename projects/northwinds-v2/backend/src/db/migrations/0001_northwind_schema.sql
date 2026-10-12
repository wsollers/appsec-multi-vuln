-- Northwind core schema. Column names mirror the classic dataset.
-- Foreign keys are enforced at the database layer (PRAGMA foreign_keys = ON).

CREATE TABLE IF NOT EXISTS categories (
  CategoryID   INTEGER PRIMARY KEY AUTOINCREMENT,
  CategoryName TEXT NOT NULL,
  Description  TEXT
);

CREATE TABLE IF NOT EXISTS suppliers (
  SupplierID   INTEGER PRIMARY KEY AUTOINCREMENT,
  CompanyName  TEXT NOT NULL,
  ContactName  TEXT,
  ContactTitle TEXT,
  City         TEXT,
  Country      TEXT,
  Phone        TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  CustomerID   TEXT PRIMARY KEY,
  CompanyName  TEXT NOT NULL,
  ContactName  TEXT,
  ContactTitle TEXT,
  City         TEXT,
  Country      TEXT,
  Phone        TEXT
);

CREATE TABLE IF NOT EXISTS employees (
  EmployeeID INTEGER PRIMARY KEY AUTOINCREMENT,
  LastName   TEXT NOT NULL,
  FirstName  TEXT NOT NULL,
  Title      TEXT,
  ReportsTo  INTEGER,
  City       TEXT,
  Country    TEXT,
  FOREIGN KEY (ReportsTo) REFERENCES employees (EmployeeID)
);

CREATE TABLE IF NOT EXISTS shippers (
  ShipperID   INTEGER PRIMARY KEY AUTOINCREMENT,
  CompanyName TEXT NOT NULL,
  Phone       TEXT
);

CREATE TABLE IF NOT EXISTS products (
  ProductID    INTEGER PRIMARY KEY AUTOINCREMENT,
  ProductName  TEXT NOT NULL,
  SupplierID   INTEGER,
  CategoryID   INTEGER,
  UnitPrice    REAL NOT NULL DEFAULT 0 CHECK (UnitPrice >= 0),
  UnitsInStock INTEGER NOT NULL DEFAULT 0 CHECK (UnitsInStock >= 0),
  Discontinued INTEGER NOT NULL DEFAULT 0 CHECK (Discontinued IN (0, 1)),
  FOREIGN KEY (SupplierID) REFERENCES suppliers (SupplierID),
  FOREIGN KEY (CategoryID) REFERENCES categories (CategoryID)
);

CREATE TABLE IF NOT EXISTS orders (
  OrderID      INTEGER PRIMARY KEY AUTOINCREMENT,
  CustomerID   TEXT,
  EmployeeID   INTEGER,
  OrderDate    TEXT,
  RequiredDate TEXT,
  ShippedDate  TEXT,
  ShipVia      INTEGER,
  Freight      REAL NOT NULL DEFAULT 0 CHECK (Freight >= 0),
  ShipName     TEXT,
  ShipCity     TEXT,
  ShipCountry  TEXT,
  FOREIGN KEY (CustomerID) REFERENCES customers (CustomerID),
  FOREIGN KEY (EmployeeID) REFERENCES employees (EmployeeID),
  FOREIGN KEY (ShipVia) REFERENCES shippers (ShipperID)
);

CREATE TABLE IF NOT EXISTS order_details (
  OrderID   INTEGER NOT NULL,
  ProductID INTEGER NOT NULL,
  UnitPrice REAL NOT NULL DEFAULT 0 CHECK (UnitPrice >= 0),
  Quantity  INTEGER NOT NULL DEFAULT 1 CHECK (Quantity > 0),
  Discount  REAL NOT NULL DEFAULT 0 CHECK (Discount >= 0 AND Discount <= 1),
  PRIMARY KEY (OrderID, ProductID),
  FOREIGN KEY (OrderID) REFERENCES orders (OrderID) ON DELETE CASCADE,
  FOREIGN KEY (ProductID) REFERENCES products (ProductID)
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products (CategoryID);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products (SupplierID);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (CustomerID);
CREATE INDEX IF NOT EXISTS idx_orders_employee ON orders (EmployeeID);
CREATE INDEX IF NOT EXISTS idx_order_details_product ON order_details (ProductID);
