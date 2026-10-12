-- Application users and their roles. This models the subject/claims that an
-- external OAuth2/OIDC provider would assert. `employee_id` links a `sales`
-- user to the Northwind employee they act as, which drives object-level
-- authorization on orders (design §6).

CREATE TABLE IF NOT EXISTS app_users (
  Sub        TEXT PRIMARY KEY,
  Username   TEXT NOT NULL UNIQUE,
  Roles      TEXT NOT NULL, -- comma-separated subset of: viewer,sales,admin
  EmployeeID INTEGER,
  FOREIGN KEY (EmployeeID) REFERENCES employees (EmployeeID)
);
