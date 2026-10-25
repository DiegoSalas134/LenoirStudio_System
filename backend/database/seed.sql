USE lenoirstudio;

-- 1. SERVICIOS PRINCIPALES

INSERT INTO service (service_id, name, duration_hours, base_price)
VALUES
    (1, 'Aplicacion', 3.00, 0.00),
    (2, 'Relleno',    3.00, 0.00),
    (3, 'Retiro',     1.00, 0.00)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    duration_hours = VALUES(duration_hours);

-- 2. TECNICAS

INSERT INTO service_technique (technique_id, name)
VALUES
    (1, 'Softgel'),
    (2, 'Polygel'),
    (3, 'Gel Semipermanente'),
    (4, 'Rubber Gel'),
    (5, 'Builder Gel')
ON DUPLICATE KEY UPDATE
    name = VALUES(name);

-- 3. PRECIOS BASE POR SERVICIO Y TECNICA

INSERT INTO service_base_price (
    service_id,
    technique_id,
    base_price,
    included_tones,
    min_length,
    included_length_through,
    length_increment,
    max_length,
    length_natural_only
)
VALUES
    (1, 1, 320.00, 4, 1, 3, 20.00, 9, FALSE),
    (1, 2, 340.00, 4, 1, 3, 25.00, 9, FALSE),
    (1, 3, 200.00, 4, NULL, NULL, 0.00, NULL, FALSE),
    (1, 4, 300.00, 4, 1, 3, 0.00, 3, TRUE),
    (1, 5, 320.00, 4, 1, 3, 15.00, 9, FALSE),
    (2, 1, 280.00, 4, NULL, NULL, 0.00, NULL, FALSE),
    (2, 2, 300.00, 4, NULL, NULL, 0.00, NULL, FALSE),
    (2, 3, 160.00, 4, NULL, NULL, 0.00, NULL, FALSE),
    (2, 4, 260.00, 4, NULL, NULL, 0.00, NULL, FALSE),
    (2, 5, 280.00, 4, NULL, NULL, 0.00, NULL, FALSE)
ON DUPLICATE KEY UPDATE
    base_price = VALUES(base_price),
    included_tones = VALUES(included_tones),
    min_length = VALUES(min_length),
    included_length_through = VALUES(included_length_through),
    length_increment = VALUES(length_increment),
    max_length = VALUES(max_length),
    length_natural_only = VALUES(length_natural_only);

-- 4. MATERIALES DE RETIRO

INSERT INTO removal_material (
    name,
    price_per_nail,
    lenoir_price_per_nail
)
VALUES
    ('Acrilico', 10.00, 5.00),
    ('Builder Gel', 10.00, 5.00),
    ('Polygel', 10.00, 5.00),
    ('Softgel', 10.00, 5.00),
    ('Rubber Gel', 7.00, 3.50),
    ('Gel Semipermanente', 7.00, 3.50)
ON DUPLICATE KEY UPDATE
    price_per_nail = VALUES(price_per_nail),
    lenoir_price_per_nail = VALUES(lenoir_price_per_nail);

-- 5. OPCIONES DE SERVICIO


INSERT INTO service_option (
    name,
    category,
    unit_price,
    unit_type,
    is_per_nail
)
SELECT
    catalog.name,
    catalog.category,
    catalog.unit_price,
    catalog.unit_type,
    catalog.is_per_nail
FROM (
    SELECT 'Francesa' AS name, 'decoration' AS category,
           5.00 AS unit_price, 'per_nail' AS unit_type, TRUE AS is_per_nail
    UNION ALL SELECT '3D simple', 'decoration', 20.00, 'per_nail', TRUE
    UNION ALL SELECT '3D complejo', 'decoration', 40.00, 'per_nail', TRUE
    UNION ALL SELECT 'Chrome ua completa', 'decoration', 5.00, 'per_nail', TRUE
    UNION ALL SELECT 'Chrome detalles simples', 'decoration', 10.00, 'per_nail', TRUE
    UNION ALL SELECT 'Chrome detalles complejos', 'decoration', 15.00, 'per_nail', TRUE
    UNION ALL SELECT 'Chrome 3D', 'decoration', 22.00, 'per_nail', TRUE
    UNION ALL SELECT 'Pintura a mano simple', 'decoration', 15.00, 'per_nail', TRUE
    UNION ALL SELECT 'Pintura a mano compleja', 'decoration', 20.00, 'per_nail', TRUE
    UNION ALL SELECT 'Efecto aurora', 'decoration', 7.00, 'per_nail', TRUE
    UNION ALL SELECT 'Aura basica', 'decoration', 7.00, 'per_nail', TRUE
    UNION ALL SELECT 'Aura mixta', 'decoration', 10.00, 'per_nail', TRUE
    UNION ALL SELECT 'Foil', 'decoration', 5.00, 'per_nail', TRUE
    UNION ALL SELECT 'Cadena de cuentas', 'decoration', 9.00, 'per_nail', TRUE

    UNION ALL SELECT 'Diamante pequeno', 'piece', 3.00, 'per_piece', FALSE
    UNION ALL SELECT 'Diamante grande', 'piece', 6.00, 'per_piece', FALSE
    UNION ALL SELECT 'Picos', 'piece', 4.00, 'per_piece', FALSE
    UNION ALL SELECT 'Cuentas', 'piece', 1.00, 'per_piece', FALSE
    UNION ALL SELECT 'Media perla metalica pequena', 'piece', 2.00, 'per_piece', FALSE
    UNION ALL SELECT 'Media perla metalica grande', 'piece', 5.00, 'per_piece', FALSE

    UNION ALL SELECT 'Tono adicional', 'extra_tone', 5.00, 'per_tone', FALSE
) AS catalog
WHERE NOT EXISTS (
    SELECT 1
    FROM service_option existing
    WHERE existing.name = catalog.name
      AND existing.category = catalog.category
);