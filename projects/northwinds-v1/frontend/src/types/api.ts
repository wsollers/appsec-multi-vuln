export type Role = 'viewer' | 'sales' | 'admin';

export interface AuthenticatedUser {
  sub: string;
  username: string;
  roles: Role[];
  employeeId: number | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface Category {
  categoryId: number;
  categoryName: string;
  description: string | null;
}

export interface Supplier {
  supplierId: number;
  companyName: string;
  contactName: string | null;
  contactTitle: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
}

export interface Product {
  productId: number;
  productName: string;
  supplierId: number | null;
  categoryId: number | null;
  unitPrice: number;
  unitsInStock: number;
  discontinued: boolean;
}

export interface Customer {
  customerId: string;
  companyName: string;
  contactName: string | null;
  contactTitle: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
}

export interface Employee {
  employeeId: number;
  lastName: string;
  firstName: string;
  title: string | null;
  reportsTo: number | null;
  city: string | null;
  country: string | null;
}

export interface Shipper {
  shipperId: number;
  companyName: string;
  phone: string | null;
}

export interface Order {
  orderId: number;
  customerId: string | null;
  employeeId: number | null;
  orderDate: string | null;
  requiredDate: string | null;
  shippedDate: string | null;
  shipVia: number | null;
  freight: number;
  shipName: string | null;
  shipCity: string | null;
  shipCountry: string | null;
}

export interface ApiError {
  error: { code: string; message: string };
}
