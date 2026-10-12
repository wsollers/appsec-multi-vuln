import type {
  Category,
  Customer,
  Employee,
  Order,
  OrderDetail,
  Product,
  Shipper,
  Supplier,
} from '../domain/types.js';

/** Raw row shapes as returned by SQLite (column names match the schema). */
type Row = Record<string, unknown>;

const asString = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
const asNumber = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v);

export const mapCategory = (r: Row): Category => ({
  categoryId: Number(r.CategoryID),
  categoryName: String(r.CategoryName),
  description: asString(r.Description),
});

export const mapSupplier = (r: Row): Supplier => ({
  supplierId: Number(r.SupplierID),
  companyName: String(r.CompanyName),
  contactName: asString(r.ContactName),
  contactTitle: asString(r.ContactTitle),
  city: asString(r.City),
  country: asString(r.Country),
  phone: asString(r.Phone),
});

export const mapCustomer = (r: Row): Customer => ({
  customerId: String(r.CustomerID),
  companyName: String(r.CompanyName),
  contactName: asString(r.ContactName),
  contactTitle: asString(r.ContactTitle),
  city: asString(r.City),
  country: asString(r.Country),
  phone: asString(r.Phone),
});

export const mapEmployee = (r: Row): Employee => ({
  employeeId: Number(r.EmployeeID),
  lastName: String(r.LastName),
  firstName: String(r.FirstName),
  title: asString(r.Title),
  reportsTo: asNumber(r.ReportsTo),
  city: asString(r.City),
  country: asString(r.Country),
});

export const mapShipper = (r: Row): Shipper => ({
  shipperId: Number(r.ShipperID),
  companyName: String(r.CompanyName),
  phone: asString(r.Phone),
});

export const mapProduct = (r: Row): Product => ({
  productId: Number(r.ProductID),
  productName: String(r.ProductName),
  supplierId: asNumber(r.SupplierID),
  categoryId: asNumber(r.CategoryID),
  unitPrice: Number(r.UnitPrice),
  unitsInStock: Number(r.UnitsInStock),
  discontinued: Number(r.Discontinued) === 1,
});

export const mapOrder = (r: Row): Order => ({
  orderId: Number(r.OrderID),
  customerId: asString(r.CustomerID),
  employeeId: asNumber(r.EmployeeID),
  orderDate: asString(r.OrderDate),
  requiredDate: asString(r.RequiredDate),
  shippedDate: asString(r.ShippedDate),
  shipVia: asNumber(r.ShipVia),
  freight: Number(r.Freight),
  shipName: asString(r.ShipName),
  shipCity: asString(r.ShipCity),
  shipCountry: asString(r.ShipCountry),
});

export const mapOrderDetail = (r: Row): OrderDetail => ({
  orderId: Number(r.OrderID),
  productId: Number(r.ProductID),
  unitPrice: Number(r.UnitPrice),
  quantity: Number(r.Quantity),
  discount: Number(r.Discount),
});
