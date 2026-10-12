export const typeDefs = /* GraphQL */ `
  type Category {
    categoryId: Int!
    categoryName: String!
    description: String
  }

  type Supplier {
    supplierId: Int!
    companyName: String!
    contactName: String
    contactTitle: String
    city: String
    country: String
    phone: String
  }

  type Product {
    productId: Int!
    productName: String!
    supplierId: Int
    categoryId: Int
    unitPrice: Float!
    unitsInStock: Int!
    discontinued: Boolean!
  }

  type Customer {
    customerId: ID!
    companyName: String!
    contactName: String
    contactTitle: String
    city: String
    country: String
    phone: String
  }

  type Employee {
    employeeId: Int!
    lastName: String!
    firstName: String!
    title: String
    reportsTo: Int
    city: String
    country: String
  }

  type Shipper {
    shipperId: Int!
    companyName: String!
    phone: String
  }

  type OrderDetail {
    orderId: Int!
    productId: Int!
    unitPrice: Float!
    quantity: Int!
    discount: Float!
  }

  type Order {
    orderId: Int!
    customerId: ID
    employeeId: Int
    orderDate: String
    requiredDate: String
    shippedDate: String
    shipVia: Int
    freight: Float!
    shipName: String
    shipCity: String
    shipCountry: String
    details: [OrderDetail!]!
  }

  type PageInfo {
    page: Int!
    pageSize: Int!
    total: Int!
  }

  type CategoryPage {
    items: [Category!]!
    pageInfo: PageInfo!
  }
  type ProductPage {
    items: [Product!]!
    pageInfo: PageInfo!
  }
  type CustomerPage {
    items: [Customer!]!
    pageInfo: PageInfo!
  }
  type SupplierPage {
    items: [Supplier!]!
    pageInfo: PageInfo!
  }
  type EmployeePage {
    items: [Employee!]!
    pageInfo: PageInfo!
  }
  type ShipperPage {
    items: [Shipper!]!
    pageInfo: PageInfo!
  }
  type OrderPage {
    items: [Order!]!
    pageInfo: PageInfo!
  }

  input ProductInput {
    productName: String!
    supplierId: Int
    categoryId: Int
    unitPrice: Float = 0
    unitsInStock: Int = 0
    discontinued: Boolean = false
  }

  input ProductUpdateInput {
    productName: String
    supplierId: Int
    categoryId: Int
    unitPrice: Float
    unitsInStock: Int
    discontinued: Boolean
  }

  input CategoryInput {
    categoryName: String!
    description: String
  }

  input OrderDetailInput {
    productId: Int!
    unitPrice: Float!
    quantity: Int!
    discount: Float = 0
  }

  input OrderInput {
    customerId: ID
    employeeId: Int
    orderDate: String
    requiredDate: String
    shippedDate: String
    shipVia: Int
    freight: Float = 0
    shipName: String
    shipCity: String
    shipCountry: String
    details: [OrderDetailInput!]!
  }

  type Query {
    categories(page: Int = 1, pageSize: Int = 25): CategoryPage!
    category(id: Int!): Category
    products(page: Int = 1, pageSize: Int = 25, categoryId: Int): ProductPage!
    product(id: Int!): Product
    customers(page: Int = 1, pageSize: Int = 25): CustomerPage!
    customer(id: ID!): Customer
    suppliers(page: Int = 1, pageSize: Int = 25): SupplierPage!
    employees(page: Int = 1, pageSize: Int = 25): EmployeePage!
    shippers(page: Int = 1, pageSize: Int = 25): ShipperPage!
    orders(page: Int = 1, pageSize: Int = 25): OrderPage!
    order(id: Int!): Order
  }

  type Mutation {
    createProduct(input: ProductInput!): Product!
    updateProduct(id: Int!, input: ProductUpdateInput!): Product!
    deleteProduct(id: Int!): Boolean!
    createCategory(input: CategoryInput!): Category!
    createOrder(input: OrderInput!): Order!
    deleteOrder(id: Int!): Boolean!
  }
`;
