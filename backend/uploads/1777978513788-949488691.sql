-- =====================================
-- DASHBOARD SAMPLE DATABASE
-- =====================================

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;

-- CUSTOMERS
CREATE TABLE customers (
    customer_id INT PRIMARY KEY,
    customer_name VARCHAR(100),
    city VARCHAR(50),
    country VARCHAR(50),
    signup_date DATE
);

INSERT INTO customers VALUES
(1,'Amit Sharma','Mumbai','India','2023-01-10'),
(2,'Neha Verma','Delhi','India','2023-02-15'),
(3,'John Doe','New York','USA','2023-03-20'),
(4,'Sara Khan','Pune','India','2023-04-05'),
(5,'Rahul Mehta','Bangalore','India','2023-05-12'),
(6,'Priya Singh','Mumbai','India','2023-06-18'),
(7,'David Miller','Chicago','USA','2023-07-22'),
(8,'Anjali Gupta','Hyderabad','India','2023-08-11');

-- PRODUCTS
CREATE TABLE products (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(100),
    category VARCHAR(50),
    price DECIMAL(10,2)
);

INSERT INTO products VALUES
(101,'Laptop','Electronics',80000),
(102,'Mobile Phone','Electronics',30000),
(103,'Running Shoes','Fashion',5000),
(104,'Wrist Watch','Accessories',7000),
(105,'Backpack','Travel',2500),
(106,'Headphones','Electronics',4000),
(107,'T-Shirt','Fashion',1500);

-- ORDERS
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    order_date DATE,
    total_amount DECIMAL(10,2),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

INSERT INTO orders VALUES
(1001,1,'2024-01-10',85000),
(1002,2,'2024-01-12',30000),
(1003,3,'2024-02-05',5000),
(1004,4,'2024-02-20',7000),
(1005,5,'2024-03-01',2500),
(1006,1,'2024-03-15',30000),
(1007,6,'2024-03-18',4000),
(1008,7,'2024-04-02',80000),
(1009,8,'2024-04-10',1500);

-- ORDER ITEMS
CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT,
    subtotal DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

INSERT INTO order_items VALUES
(1,1001,101,1,80000),
(2,1001,104,1,5000),
(3,1002,102,1,30000),
(4,1003,103,1,5000),
(5,1004,104,1,7000),
(6,1005,105,1,2500),
(7,1006,102,1,30000),
(8,1007,106,1,4000),
(9,1008,101,1,80000),
(10,1009,107,1,1500);
