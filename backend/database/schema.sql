
CREATE DATABASE IF NOT EXISTS lenoirstudio
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE lenoirstudio;

-- 1. Customers
CREATE TABLE IF NOT EXISTS customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 2. Services
CREATE TABLE IF NOT EXISTS service (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    duration_hours DECIMAL(4,2) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    CONSTRAINT chk_service_duration CHECK (duration_hours > 0),
    CONSTRAINT chk_service_price CHECK (base_price >= 0)
) ENGINE=InnoDB;

-- 3. Inventory
CREATE TABLE IF NOT EXISTS inventory (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 0,
    min_threshold DECIMAL(15,2) NOT NULL DEFAULT 0,
    unit_of_measure VARCHAR(10) NOT NULL,
    unit_cost DECIMAL(22,2) NOT NULL DEFAULT 0,
    CONSTRAINT chk_inventory_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_inventory_threshold CHECK (min_threshold >= 0),
    CONSTRAINT chk_inventory_cost CHECK (unit_cost >= 0)
) ENGINE=InnoDB;

-- 4. Administrator
CREATE TABLE IF NOT EXISTS admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- 5. Service options
-- Named service_option to avoid a potentially reserved SQL identifier.
CREATE TABLE IF NOT EXISTS service_option (
    option_id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    is_per_nail BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_option_price CHECK (unit_price >= 0)
) ENGINE=InnoDB;

-- 6. Time blocks
CREATE TABLE IF NOT EXISTS block_time (
    block_id INT AUTO_INCREMENT PRIMARY KEY,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    reason VARCHAR(255),
    CONSTRAINT chk_block_time CHECK (end_time > start_time)
) ENGINE=InnoDB;

-- 7. Appointments
CREATE TABLE IF NOT EXISTS appointment (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    service_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    quote_details JSON,
    design_ref_path VARCHAR(255),
    completed_at DATETIME,
    inventory_deducted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_appointment_schedule (start_time, end_time),
    INDEX idx_appointment_status (status),
    INDEX idx_appointment_customer (customer_id),

    CONSTRAINT fk_appointment_customer
        FOREIGN KEY (customer_id)
        REFERENCES customer(customer_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_appointment_service
        FOREIGN KEY (service_id)
        REFERENCES service(service_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_appointment_status
        CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),

    CONSTRAINT chk_appointment_time
        CHECK (end_time > start_time),

    CONSTRAINT chk_appointment_price
        CHECK (total_price >= 0)
) ENGINE=InnoDB;

-- 8. Materials used by each service
CREATE TABLE IF NOT EXISTS service_material (
    service_material_id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity_used DECIMAL(10,2) NOT NULL,

    UNIQUE KEY uq_service_material (service_id, item_id),

    CONSTRAINT fk_material_service
        FOREIGN KEY (service_id)
        REFERENCES service(service_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_material_inventory
        FOREIGN KEY (item_id)
        REFERENCES inventory(item_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_material_quantity CHECK (quantity_used > 0)
) ENGINE=InnoDB;

-- 9. Expenses
CREATE TABLE IF NOT EXISTS expense (
    expense_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    quantity_purchased DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,

    INDEX idx_expense_date (expense_date),

    CONSTRAINT fk_expense_inventory
        FOREIGN KEY (item_id)
        REFERENCES inventory(item_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_expense_amount CHECK (amount >= 0),
    CONSTRAINT chk_expense_quantity CHECK (quantity_purchased > 0)
) ENGINE=InnoDB;

-- 10. Appointment rescheduling history
CREATE TABLE IF NOT EXISTS appointment_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    old_start_time DATETIME NOT NULL,
    old_end_time DATETIME NOT NULL,
    new_start_time DATETIME NOT NULL,
    new_end_time DATETIME NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255),

    INDEX idx_history_appointment (appointment_id),

    CONSTRAINT fk_history_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointment(appointment_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_history_old_time
        CHECK (old_end_time > old_start_time),

    CONSTRAINT chk_history_new_time
        CHECK (new_end_time > new_start_time)
) ENGINE=InnoDB;

-- 11. Payments
CREATE TABLE IF NOT EXISTS payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_type VARCHAR(20) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    receipt_path VARCHAR(255),

    INDEX idx_payment_appointment (appointment_id),
    INDEX idx_payment_paid_at (paid_at),
    INDEX idx_payment_status (payment_status),

    CONSTRAINT fk_payment_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointment(appointment_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_payment_amount
        CHECK (amount > 0),

    CONSTRAINT chk_payment_type
        CHECK (payment_type IN ('deposit', 'installment', 'final')),

    CONSTRAINT chk_payment_method
        CHECK (payment_method IN ('cash', 'transfer', 'card')),

    CONSTRAINT chk_payment_status
        CHECK (payment_status IN ('pending', 'approved', 'refunded'))
) ENGINE=InnoDB;

-- 12. Notifications
CREATE TABLE IF NOT EXISTS notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    whatsapp_url TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_notification_appointment (appointment_id),

    CONSTRAINT fk_notification_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointment(appointment_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;
