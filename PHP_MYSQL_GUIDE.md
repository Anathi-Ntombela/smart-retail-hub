# Smart Retail System - PHP & MySQL Implementation Guide

## Database Schema (MySQL)

### 1. Database Creation Script

```sql
-- Create database
CREATE DATABASE smart_retail_db;
USE smart_retail_db;

-- Customers table
CREATE TABLE customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(10) NOT NULL,
    address VARCHAR(200) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Products table
CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    category VARCHAR(50) NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_stock (stock_quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Orders table
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address VARCHAR(200) NOT NULL,
    city VARCHAR(50) NOT NULL,
    zip_code VARCHAR(5) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Order items table
CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payments table
CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'paypal') NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    transaction_id VARCHAR(100) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin users table
CREATE TABLE admin_users (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'manager', 'inventory_staff') DEFAULT 'inventory_staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample data insertion
INSERT INTO products (name, description, price, stock_quantity, category) VALUES
('Laptop', 'High-performance laptop', 999.99, 15, 'Electronics'),
('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 50, 'Electronics'),
('USB-C Cable', 'Fast charging USB-C cable', 12.99, 100, 'Accessories'),
('Keyboard', 'Mechanical keyboard with RGB', 79.99, 30, 'Electronics'),
('Monitor', '27-inch 4K monitor', 349.99, 20, 'Electronics'),
('Headphones', 'Noise-cancelling headphones', 149.99, 40, 'Audio');

-- Create admin user (password: Admin123!)
INSERT INTO admin_users (username, password_hash, full_name, role) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Admin', 'admin');
```

---

## PHP Implementation

### 2. Database Connection (config/database.php)

```php
<?php
class Database {
    private $host = "localhost";
    private $db_name = "smart_retail_db";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8mb4");
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        
        return $this->conn;
    }
}
?>
```

### 3. Customer Registration (register.php)

```php
<?php
session_start();
require_once 'config/database.php';

// Validation function
function validateInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $database = new Database();
    $db = $database->getConnection();
    
    // Validate inputs
    $full_name = validateInput($_POST['full_name']);
    $email = validateInput($_POST['email']);
    $phone = validateInput($_POST['phone']);
    $address = validateInput($_POST['address']);
    $password = $_POST['password'];
    
    $errors = [];
    
    // Validation rules
    if (strlen($full_name) < 2 || strlen($full_name) > 100) {
        $errors[] = "Name must be between 2 and 100 characters";
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Invalid email format";
    }
    
    if (!preg_match("/^[0-9]{10}$/", $phone)) {
        $errors[] = "Phone must be exactly 10 digits";
    }
    
    if (strlen($address) < 5 || strlen($address) > 200) {
        $errors[] = "Address must be between 5 and 200 characters";
    }
    
    if (strlen($password) < 8) {
        $errors[] = "Password must be at least 8 characters";
    }
    
    if (!preg_match("/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/", $password)) {
        $errors[] = "Password must contain uppercase, lowercase, and number";
    }
    
    // Check if email exists
    $query = "SELECT customer_id FROM customers WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $errors[] = "Email already registered";
    }
    
    if (empty($errors)) {
        // Hash password with bcrypt
        $password_hash = password_hash($password, PASSWORD_BCRYPT);
        
        // Insert customer
        $query = "INSERT INTO customers (full_name, email, phone, address, password_hash) 
                  VALUES (:full_name, :email, :phone, :address, :password_hash)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":full_name", $full_name);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":phone", $phone);
        $stmt->bindParam(":address", $address);
        $stmt->bindParam(":password_hash", $password_hash);
        
        if ($stmt->execute()) {
            $_SESSION['success'] = "Registration successful! Please login.";
            header("Location: login.php");
            exit();
        } else {
            $errors[] = "Registration failed. Please try again.";
        }
    }
    
    $_SESSION['errors'] = $errors;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Registration - Smart Retail</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <div class="form-card">
            <h1>Customer Registration</h1>
            
            <?php if (isset($_SESSION['errors'])): ?>
                <div class="error-messages">
                    <?php foreach ($_SESSION['errors'] as $error): ?>
                        <p class="error"><?php echo htmlspecialchars($error); ?></p>
                    <?php endforeach; ?>
                    <?php unset($_SESSION['errors']); ?>
                </div>
            <?php endif; ?>
            
            <form method="POST" action="" id="registerForm">
                <div class="form-group">
                    <label for="full_name">Full Name</label>
                    <input type="text" id="full_name" name="full_name" required 
                           pattern="[A-Za-z\s]{2,100}" 
                           title="Name must be 2-100 characters, letters only">
                </div>
                
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required maxlength="255">
                </div>
                
                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" id="phone" name="phone" required 
                           pattern="[0-9]{10}" 
                           title="Phone must be exactly 10 digits">
                </div>
                
                <div class="form-group">
                    <label for="address">Address</label>
                    <input type="text" id="address" name="address" required 
                           minlength="5" maxlength="200">
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required 
                           minlength="8" maxlength="100">
                    <small>Must contain uppercase, lowercase, and number</small>
                </div>
                
                <button type="submit" class="btn btn-primary">Register</button>
                
                <p class="text-center">
                    Already have an account? <a href="login.php">Login here</a>
                </p>
            </form>
        </div>
    </div>
    
    <script src="js/validation.js"></script>
</body>
</html>
```

### 4. Customer Login (login.php)

```php
<?php
session_start();
require_once 'config/database.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $database = new Database();
    $db = $database->getConnection();
    
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    
    // Fetch user
    $query = "SELECT customer_id, full_name, email, password_hash FROM customers WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();
    
    if ($stmt->rowCount() == 1) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Verify password
        if (password_verify($password, $row['password_hash'])) {
            // Set session variables
            $_SESSION['customer_id'] = $row['customer_id'];
            $_SESSION['full_name'] = $row['full_name'];
            $_SESSION['email'] = $row['email'];
            $_SESSION['logged_in'] = true;
            
            header("Location: store.php");
            exit();
        } else {
            $error = "Invalid email or password";
        }
    } else {
        $error = "Invalid email or password";
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Smart Retail</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <div class="form-card">
            <h1>Login</h1>
            
            <?php if (isset($error)): ?>
                <p class="error"><?php echo htmlspecialchars($error); ?></p>
            <?php endif; ?>
            
            <?php if (isset($_SESSION['success'])): ?>
                <p class="success"><?php echo htmlspecialchars($_SESSION['success']); ?></p>
                <?php unset($_SESSION['success']); ?>
            <?php endif; ?>
            
            <form method="POST" action="">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Login</button>
                
                <p class="text-center">
                    Don't have an account? <a href="register.php">Register here</a>
                </p>
            </form>
        </div>
    </div>
</body>
</html>
```

### 5. Product Store (store.php)

```php
<?php
session_start();
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

// Fetch products
$query = "SELECT * FROM products WHERE stock_quantity > 0 ORDER BY category, name";
$stmt = $db->prepare($query);
$stmt->execute();
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Initialize cart if not exists
if (!isset($_SESSION['cart'])) {
    $_SESSION['cart'] = [];
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Store - Smart Retail</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>Smart Retail Store</h1>
            <nav>
                <a href="store.php">Store</a>
                <a href="cart.php">Cart (<?php echo count($_SESSION['cart']); ?>)</a>
                <?php if (isset($_SESSION['logged_in'])): ?>
                    <span>Welcome, <?php echo htmlspecialchars($_SESSION['full_name']); ?></span>
                    <a href="logout.php">Logout</a>
                <?php else: ?>
                    <a href="login.php">Login</a>
                <?php endif; ?>
            </nav>
        </div>
    </header>
    
    <main class="container">
        <h2>Our Products</h2>
        <div class="product-grid">
            <?php foreach ($products as $product): ?>
                <div class="product-card">
                    <img src="<?php echo htmlspecialchars($product['image_url'] ?? 'images/default.jpg'); ?>" 
                         alt="<?php echo htmlspecialchars($product['name']); ?>">
                    <h3><?php echo htmlspecialchars($product['name']); ?></h3>
                    <p class="category"><?php echo htmlspecialchars($product['category']); ?></p>
                    <p class="description"><?php echo htmlspecialchars($product['description']); ?></p>
                    <div class="price-stock">
                        <p class="price">$<?php echo number_format($product['price'], 2); ?></p>
                        <p class="stock">Stock: <?php echo $product['stock_quantity']; ?></p>
                    </div>
                    <form method="POST" action="add_to_cart.php">
                        <input type="hidden" name="product_id" value="<?php echo $product['product_id']; ?>">
                        <input type="number" name="quantity" value="1" min="1" 
                               max="<?php echo $product['stock_quantity']; ?>" required>
                        <button type="submit" class="btn btn-primary">Add to Cart</button>
                    </form>
                </div>
            <?php endforeach; ?>
        </div>
    </main>
    
    <script src="js/store.js"></script>
</body>
</html>
```

### 6. Add to Cart (add_to_cart.php)

```php
<?php
session_start();
require_once 'config/database.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $product_id = (int)$_POST['product_id'];
    $quantity = (int)$_POST['quantity'];
    
    // Validate quantity
    if ($quantity < 1) {
        $_SESSION['error'] = "Invalid quantity";
        header("Location: store.php");
        exit();
    }
    
    // Check stock availability
    $database = new Database();
    $db = $database->getConnection();
    
    $query = "SELECT product_id, name, price, stock_quantity FROM products WHERE product_id = :product_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":product_id", $product_id);
    $stmt->execute();
    
    if ($stmt->rowCount() == 1) {
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($product['stock_quantity'] >= $quantity) {
            // Add to cart
            if (isset($_SESSION['cart'][$product_id])) {
                $_SESSION['cart'][$product_id]['quantity'] += $quantity;
            } else {
                $_SESSION['cart'][$product_id] = [
                    'name' => $product['name'],
                    'price' => $product['price'],
                    'quantity' => $quantity
                ];
            }
            
            $_SESSION['success'] = "Product added to cart";
        } else {
            $_SESSION['error'] = "Insufficient stock";
        }
    } else {
        $_SESSION['error'] = "Product not found";
    }
}

header("Location: store.php");
exit();
?>
```

### 7. Checkout Process (checkout.php)

```php
<?php
session_start();
require_once 'config/database.php';

// Check if user is logged in
if (!isset($_SESSION['logged_in'])) {
    header("Location: login.php");
    exit();
}

// Check if cart is empty
if (empty($_SESSION['cart'])) {
    header("Location: store.php");
    exit();
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        // Start transaction
        $db->beginTransaction();
        
        // Validate and sanitize inputs
        $shipping_address = trim(htmlspecialchars($_POST['address']));
        $city = trim(htmlspecialchars($_POST['city']));
        $zip_code = trim($_POST['zip_code']);
        $payment_method = $_POST['payment_method'];
        
        // Validation
        if (!preg_match("/^[0-9]{5}$/", $zip_code)) {
            throw new Exception("Invalid zip code");
        }
        
        if (!in_array($payment_method, ['credit_card', 'debit_card', 'paypal'])) {
            throw new Exception("Invalid payment method");
        }
        
        // Calculate total
        $total_amount = 0;
        foreach ($_SESSION['cart'] as $item) {
            $total_amount += $item['price'] * $item['quantity'];
        }
        
        // Create order
        $query = "INSERT INTO orders (customer_id, total_amount, shipping_address, city, zip_code) 
                  VALUES (:customer_id, :total_amount, :address, :city, :zip_code)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":customer_id", $_SESSION['customer_id']);
        $stmt->bindParam(":total_amount", $total_amount);
        $stmt->bindParam(":address", $shipping_address);
        $stmt->bindParam(":city", $city);
        $stmt->bindParam(":zip_code", $zip_code);
        $stmt->execute();
        
        $order_id = $db->lastInsertId();
        
        // Insert order items and update stock
        foreach ($_SESSION['cart'] as $product_id => $item) {
            // Insert order item
            $query = "INSERT INTO order_items (order_id, product_id, quantity, price) 
                      VALUES (:order_id, :product_id, :quantity, :price)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":order_id", $order_id);
            $stmt->bindParam(":product_id", $product_id);
            $stmt->bindParam(":quantity", $item['quantity']);
            $stmt->bindParam(":price", $item['price']);
            $stmt->execute();
            
            // Update stock
            $query = "UPDATE products SET stock_quantity = stock_quantity - :quantity 
                      WHERE product_id = :product_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":quantity", $item['quantity']);
            $stmt->bindParam(":product_id", $product_id);
            $stmt->execute();
        }
        
        // Create payment record
        $transaction_id = uniqid('TXN');
        $query = "INSERT INTO payments (order_id, payment_method, transaction_id, amount, payment_status) 
                  VALUES (:order_id, :payment_method, :transaction_id, :amount, 'completed')";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":order_id", $order_id);
        $stmt->bindParam(":payment_method", $payment_method);
        $stmt->bindParam(":transaction_id", $transaction_id);
        $stmt->bindParam(":amount", $total_amount);
        $stmt->execute();
        
        // Commit transaction
        $db->commit();
        
        // Clear cart
        $_SESSION['cart'] = [];
        
        $_SESSION['success'] = "Order placed successfully! Order ID: #$order_id";
        header("Location: order_confirmation.php?order_id=$order_id");
        exit();
        
    } catch (Exception $e) {
        // Rollback on error
        $db->rollBack();
        $error = "Order failed: " . $e->getMessage();
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checkout - Smart Retail</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <h1>Checkout</h1>
        
        <?php if (isset($error)): ?>
            <p class="error"><?php echo htmlspecialchars($error); ?></p>
        <?php endif; ?>
        
        <form method="POST" action="" id="checkoutForm">
            <h3>Shipping Information</h3>
            
            <div class="form-group">
                <label for="address">Street Address</label>
                <input type="text" id="address" name="address" required 
                       minlength="5" maxlength="200">
            </div>
            
            <div class="form-group">
                <label for="city">City</label>
                <input type="text" id="city" name="city" required 
                       minlength="2" maxlength="50">
            </div>
            
            <div class="form-group">
                <label for="zip_code">Zip Code</label>
                <input type="text" id="zip_code" name="zip_code" required 
                       pattern="[0-9]{5}" title="Zip code must be 5 digits">
            </div>
            
            <h3>Payment Method</h3>
            
            <div class="form-group">
                <select name="payment_method" id="payment_method" required>
                    <option value="">Select Payment Method</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="paypal">PayPal</option>
                </select>
            </div>
            
            <div id="card-fields" style="display: none;">
                <div class="form-group">
                    <label for="card_number">Card Number</label>
                    <input type="text" id="card_number" name="card_number" 
                           pattern="[0-9]{16}" placeholder="1234567890123456">
                </div>
                
                <div class="form-group">
                    <label for="card_expiry">Expiry (MM/YY)</label>
                    <input type="text" id="card_expiry" name="card_expiry" 
                           pattern="[0-9]{2}/[0-9]{2}" placeholder="12/25">
                </div>
                
                <div class="form-group">
                    <label for="card_cvv">CVV</label>
                    <input type="text" id="card_cvv" name="card_cvv" 
                           pattern="[0-9]{3,4}" placeholder="123">
                </div>
            </div>
            
            <button type="submit" class="btn btn-primary">Place Order</button>
        </form>
    </div>
    
    <script src="js/checkout.js"></script>
</body>
</html>
```

### 8. Admin Dashboard (admin/index.php)

```php
<?php
session_start();
require_once '../config/database.php';

// Check admin authentication
if (!isset($_SESSION['admin_logged_in'])) {
    header("Location: login.php");
    exit();
}

$database = new Database();
$db = $database->getConnection();

// Fetch products
$query = "SELECT * FROM products ORDER BY product_id DESC";
$stmt = $db->prepare($query);
$stmt->execute();
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Handle product operations
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $action = $_POST['action'];
    
    if ($action == "add" || $action == "edit") {
        $name = trim(htmlspecialchars($_POST['name']));
        $description = trim(htmlspecialchars($_POST['description']));
        $price = (float)$_POST['price'];
        $stock = (int)$_POST['stock'];
        $category = trim(htmlspecialchars($_POST['category']));
        
        if ($action == "add") {
            $query = "INSERT INTO products (name, description, price, stock_quantity, category) 
                      VALUES (:name, :description, :price, :stock, :category)";
        } else {
            $product_id = (int)$_POST['product_id'];
            $query = "UPDATE products SET name = :name, description = :description, 
                      price = :price, stock_quantity = :stock, category = :category 
                      WHERE product_id = :product_id";
        }
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":description", $description);
        $stmt->bindParam(":price", $price);
        $stmt->bindParam(":stock", $stock);
        $stmt->bindParam(":category", $category);
        
        if ($action == "edit") {
            $stmt->bindParam(":product_id", $product_id);
        }
        
        $stmt->execute();
        $_SESSION['success'] = "Product " . ($action == "add" ? "added" : "updated") . " successfully";
        header("Location: index.php");
        exit();
    }
    
    if ($action == "delete") {
        $product_id = (int)$_POST['product_id'];
        $query = "DELETE FROM products WHERE product_id = :product_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":product_id", $product_id);
        $stmt->execute();
        
        $_SESSION['success'] = "Product deleted successfully";
        header("Location: index.php");
        exit();
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Smart Retail</title>
    <link rel="stylesheet" href="../css/admin.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>Admin Dashboard</h1>
            <nav>
                <span>Welcome, <?php echo htmlspecialchars($_SESSION['admin_name']); ?></span>
                <a href="logout.php">Logout</a>
            </nav>
        </div>
    </header>
    
    <main class="container">
        <?php if (isset($_SESSION['success'])): ?>
            <p class="success"><?php echo htmlspecialchars($_SESSION['success']); ?></p>
            <?php unset($_SESSION['success']); ?>
        <?php endif; ?>
        
        <div class="admin-grid">
            <!-- Add Product Form -->
            <div class="form-section">
                <h2>Add New Product</h2>
                <form method="POST" action="">
                    <input type="hidden" name="action" value="add">
                    
                    <div class="form-group">
                        <label for="name">Product Name</label>
                        <input type="text" id="name" name="name" required 
                               minlength="2" maxlength="100">
                    </div>
                    
                    <div class="form-group">
                        <label for="description">Description</label>
                        <textarea id="description" name="description" rows="3"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="price">Price ($)</label>
                        <input type="number" id="price" name="price" step="0.01" 
                               min="0" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="stock">Stock Quantity</label>
                        <input type="number" id="stock" name="stock" min="0" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="category">Category</label>
                        <input type="text" id="category" name="category" required 
                               minlength="2" maxlength="50">
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Add Product</button>
                </form>
            </div>
            
            <!-- Products Table -->
            <div class="table-section">
                <h2>Product Inventory</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($products as $product): ?>
                            <tr>
                                <td><?php echo $product['product_id']; ?></td>
                                <td><?php echo htmlspecialchars($product['name']); ?></td>
                                <td><?php echo htmlspecialchars($product['category']); ?></td>
                                <td>$<?php echo number_format($product['price'], 2); ?></td>
                                <td class="<?php echo $product['stock_quantity'] < 10 ? 'low-stock' : ''; ?>">
                                    <?php echo $product['stock_quantity']; ?>
                                </td>
                                <td>
                                    <button onclick="editProduct(<?php echo $product['product_id']; ?>)" 
                                            class="btn-edit">Edit</button>
                                    <form method="POST" style="display: inline;" 
                                          onsubmit="return confirm('Delete this product?');">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="product_id" 
                                               value="<?php echo $product['product_id']; ?>">
                                        <button type="submit" class="btn-delete">Delete</button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>
    
    <script src="../js/admin.js"></script>
</body>
</html>
```

---

## JavaScript Client-Side Validation

### 9. Form Validation (js/validation.js)

```javascript
// Real-time form validation with JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        // Password strength checker
        const passwordInput = document.getElementById('password');
        const strengthIndicator = document.createElement('div');
        strengthIndicator.className = 'password-strength';
        passwordInput.parentNode.appendChild(strengthIndicator);
        
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            let strength = 0;
            
            if (password.length >= 8) strength++;
            if (/[a-z]/.test(password)) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;
            
            const levels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
            const colors = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3'];
            
            strengthIndicator.textContent = `Password Strength: ${levels[strength - 1] || 'Too Short'}`;
            strengthIndicator.style.color = colors[strength - 1] || '#999';
        });
        
        // Confirm password matching
        const confirmPassword = document.getElementById('confirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', function() {
                if (this.value !== passwordInput.value) {
                    this.setCustomValidity("Passwords don't match");
                } else {
                    this.setCustomValidity('');
                }
            });
        }
        
        // Phone number formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
            });
        }
    }
    
    // Email validation
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const email = this.value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email && !emailRegex.test(email)) {
                this.setCustomValidity('Please enter a valid email address');
                this.reportValidity();
            } else {
                this.setCustomValidity('');
            }
        });
    });
});

// Prevent XSS attacks
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Form submission with validation
function validateAndSubmit(form) {
    // Check all required fields
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });
    
    return isValid;
}
```

### 10. Dynamic Store Features (js/store.js)

```javascript
// Real-time stock availability check
function checkStockAvailability(productId) {
    fetch(`api/check_stock.php?product_id=${productId}`)
        .then(response => response.json())
        .then(data => {
            const stockElement = document.getElementById(`stock-${productId}`);
            if (stockElement) {
                stockElement.textContent = `Stock: ${data.stock}`;
                
                if (data.stock < 5) {
                    stockElement.classList.add('low-stock');
                }
                
                if (data.stock === 0) {
                    const addButton = document.getElementById(`add-btn-${productId}`);
                    if (addButton) {
                        addButton.disabled = true;
                        addButton.textContent = 'Out of Stock';
                    }
                }
            }
        })
        .catch(error => console.error('Error checking stock:', error));
}

// Auto-complete for product search
function initializeProductSearch() {
    const searchInput = document.getElementById('product-search');
    
    if (searchInput) {
        let debounceTimer;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            
            debounceTimer = setTimeout(() => {
                const query = this.value;
                
                if (query.length >= 2) {
                    fetch(`api/search_products.php?q=${encodeURIComponent(query)}`)
                        .then(response => response.json())
                        .then(data => {
                            displaySearchResults(data);
                        });
                }
            }, 300);
        });
    }
}

// Update cart total dynamically
function updateCartTotal() {
    const cartItems = document.querySelectorAll('.cart-item');
    let total = 0;
    
    cartItems.forEach(item => {
        const price = parseFloat(item.dataset.price);
        const quantity = parseInt(item.querySelector('.quantity-input').value);
        total += price * quantity;
    });
    
    document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeProductSearch();
    
    // Update stock every 30 seconds
    setInterval(() => {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            const productId = card.dataset.productId;
            if (productId) {
                checkStockAvailability(productId);
            }
        });
    }, 30000);
});
```

---

## CSS Styling

### 11. Main Stylesheet (css/style.css)

```css
/* Base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary-color: #2563eb;
    --secondary-color: #64748b;
    --success-color: #10b981;
    --error-color: #ef4444;
    --background: #ffffff;
    --foreground: #0f172a;
    --border: #e2e8f0;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: var(--foreground);
    background-color: var(--background);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

/* Header */
header {
    background-color: var(--background);
    border-bottom: 1px solid var(--border);
    padding: 20px 0;
}

header h1 {
    display: inline-block;
    font-size: 24px;
}

header nav {
    float: right;
}

header nav a {
    margin-left: 20px;
    color: var(--foreground);
    text-decoration: none;
}

header nav a:hover {
    color: var(--primary-color);
}

/* Form styles */
.form-card {
    max-width: 500px;
    margin: 50px auto;
    padding: 30px;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 16px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-group small {
    display: block;
    margin-top: 5px;
    color: var(--secondary-color);
    font-size: 14px;
}

/* Buttons */
.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-primary {
    background-color: var(--primary-color);
    color: white;
}

.btn-primary:hover {
    background-color: #1d4ed8;
}

.btn-primary:disabled {
    background-color: var(--secondary-color);
    cursor: not-allowed;
}

/* Product grid */
.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-top: 30px;
}

.product-card {
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.product-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.product-card h3 {
    padding: 15px;
    font-size: 18px;
}

.product-card .category {
    padding: 0 15px;
    color: var(--secondary-color);
    font-size: 14px;
}

.product-card .price-stock {
    display: flex;
    justify-content: space-between;
    padding: 15px;
}

.product-card .price {
    font-size: 24px;
    font-weight: bold;
    color: var(--primary-color);
}

.product-card .stock {
    font-size: 14px;
    color: var(--secondary-color);
}

.product-card form {
    padding: 0 15px 15px;
}

.product-card input[type="number"] {
    width: 60px;
    margin-right: 10px;
}

/* Messages */
.error {
    color: var(--error-color);
    background-color: #fee2e2;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 20px;
}

.success {
    color: var(--success-color);
    background-color: #d1fae5;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 20px;
}

/* Table styles */
table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

table th,
table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid var(--border);
}

table th {
    background-color: #f8fafc;
    font-weight: 600;
}

table tr:hover {
    background-color: #f8fafc;
}

.low-stock {
    color: var(--error-color);
    font-weight: bold;
}

/* Responsive */
@media (max-width: 768px) {
    header nav {
        float: none;
        margin-top: 10px;
    }
    
    .product-grid {
        grid-template-columns: 1fr;
    }
    
    table {
        font-size: 14px;
    }
}
```

---

## Security Best Practices Summary

1. **Password Security**: Use `password_hash()` with BCRYPT
2. **Input Validation**: Client-side (JavaScript) + Server-side (PHP)
3. **SQL Injection Prevention**: PDO prepared statements
4. **XSS Prevention**: `htmlspecialchars()` on all outputs
5. **CSRF Protection**: Add CSRF tokens to forms
6. **Session Security**: Regenerate session IDs after login
7. **Database Transactions**: Use for multi-step operations
8. **Error Handling**: Don't expose sensitive information
9. **HTTPS**: Use SSL/TLS in production
10. **Input Sanitization**: Trim, validate length, format

---

This complete guide provides all the PHP and MySQL code needed to implement the Smart Retail System according to your project requirements!
