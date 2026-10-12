import { ResourceManager, type ResourceConfig } from '../components/ResourceManager';
import type { Category, Customer, Employee, Product, Shipper, Supplier } from '../types/api';

const dash = (v: unknown): string => (v === null || v === undefined || v === '' ? '—' : String(v));

const productConfig: ResourceConfig<Product> = {
  resource: 'products',
  title: 'Products',
  idKey: 'productId',
  columns: [
    { header: 'ID', render: (r) => String(r.productId) },
    { header: 'Name', render: (r) => r.productName },
    { header: 'Unit price', render: (r) => `$${r.unitPrice.toFixed(2)}` },
    { header: 'In stock', render: (r) => String(r.unitsInStock) },
    { header: 'Discontinued', render: (r) => (r.discontinued ? 'Yes' : 'No') },
  ],
  fields: [
    { name: 'productName', label: 'Product name', type: 'text', required: true },
    { name: 'supplierId', label: 'Supplier ID', type: 'number' },
    { name: 'categoryId', label: 'Category ID', type: 'number' },
    { name: 'unitPrice', label: 'Unit price', type: 'number' },
    { name: 'unitsInStock', label: 'Units in stock', type: 'number' },
    { name: 'discontinued', label: 'Discontinued', type: 'checkbox' },
  ],
};

const categoryConfig: ResourceConfig<Category> = {
  resource: 'categories',
  title: 'Categories',
  idKey: 'categoryId',
  columns: [
    { header: 'ID', render: (r) => String(r.categoryId) },
    { header: 'Name', render: (r) => r.categoryName },
    { header: 'Description', render: (r) => dash(r.description) },
  ],
  fields: [
    { name: 'categoryName', label: 'Category name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'text' },
  ],
};

const supplierConfig: ResourceConfig<Supplier> = {
  resource: 'suppliers',
  title: 'Suppliers',
  idKey: 'supplierId',
  columns: [
    { header: 'ID', render: (r) => String(r.supplierId) },
    { header: 'Company', render: (r) => r.companyName },
    { header: 'Contact', render: (r) => dash(r.contactName) },
    { header: 'Country', render: (r) => dash(r.country) },
  ],
  fields: [
    { name: 'companyName', label: 'Company name', type: 'text', required: true },
    { name: 'contactName', label: 'Contact name', type: 'text' },
    { name: 'contactTitle', label: 'Contact title', type: 'text' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'country', label: 'Country', type: 'text' },
    { name: 'phone', label: 'Phone', type: 'text' },
  ],
};

const customerConfig: ResourceConfig<Customer> = {
  resource: 'customers',
  title: 'Customers',
  idKey: 'customerId',
  columns: [
    { header: 'ID', render: (r) => r.customerId },
    { header: 'Company', render: (r) => r.companyName },
    { header: 'Contact', render: (r) => dash(r.contactName) },
    { header: 'Country', render: (r) => dash(r.country) },
  ],
  fields: [
    { name: 'customerId', label: 'Customer ID (5 uppercase letters)', type: 'text', required: true, createOnly: true },
    { name: 'companyName', label: 'Company name', type: 'text', required: true },
    { name: 'contactName', label: 'Contact name', type: 'text' },
    { name: 'contactTitle', label: 'Contact title', type: 'text' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'country', label: 'Country', type: 'text' },
    { name: 'phone', label: 'Phone', type: 'text' },
  ],
};

const employeeConfig: ResourceConfig<Employee> = {
  resource: 'employees',
  title: 'Employees',
  idKey: 'employeeId',
  columns: [
    { header: 'ID', render: (r) => String(r.employeeId) },
    { header: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
    { header: 'Title', render: (r) => dash(r.title) },
    { header: 'Country', render: (r) => dash(r.country) },
  ],
  fields: [
    { name: 'firstName', label: 'First name', type: 'text', required: true },
    { name: 'lastName', label: 'Last name', type: 'text', required: true },
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'reportsTo', label: 'Reports to (employee ID)', type: 'number' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'country', label: 'Country', type: 'text' },
  ],
};

const shipperConfig: ResourceConfig<Shipper> = {
  resource: 'shippers',
  title: 'Shippers',
  idKey: 'shipperId',
  columns: [
    { header: 'ID', render: (r) => String(r.shipperId) },
    { header: 'Company', render: (r) => r.companyName },
    { header: 'Phone', render: (r) => dash(r.phone) },
  ],
  fields: [
    { name: 'companyName', label: 'Company name', type: 'text', required: true },
    { name: 'phone', label: 'Phone', type: 'text' },
  ],
};

export const ProductsPage = () => <ResourceManager config={productConfig} />;
export const CategoriesPage = () => <ResourceManager config={categoryConfig} />;
export const SuppliersPage = () => <ResourceManager config={supplierConfig} />;
export const CustomersPage = () => <ResourceManager config={customerConfig} />;
export const EmployeesPage = () => <ResourceManager config={employeeConfig} />;
export const ShippersPage = () => <ResourceManager config={shipperConfig} />;
