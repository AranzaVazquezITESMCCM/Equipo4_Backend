
-- ============================================
-- DATOS DE PRUEBA
-- ============================================

-- USUARIOS DE PRUEBA
-- Contraseña de todos los usuarios de prueba: Contrasena#2026
INSERT INTO usuario (
    id,
    correo,
    contrasena,
    salt,
    nombre,
    rol_id
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'usuario1@test.com',
    '$2b$10$bzMU1DjzfwhJV4isfve.futvVda2oam2sIcDjMSHvh9IFyMDiq5fy',
    'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    'Usuario Prueba 1',
    1
),
(
    '22222222-2222-2222-2222-222222222222',
    'usuario2@test.com',
    '$2b$10$bzMU1DjzfwhJV4isfve.futvVda2oam2sIcDjMSHvh9IFyMDiq5fy',
    'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    'Usuario Prueba 2',
    1
),
(
    '33333333-3333-3333-3333-333333333333',
    'admin@test.com',
    '$2b$10$bzMU1DjzfwhJV4isfve.futvVda2oam2sIcDjMSHvh9IFyMDiq5fy',
    'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    'Administrador Prueba',
    2
),
(
    '44444444-4444-4444-4444-444444444444',
    'superadmin@test.com',
    '$2b$10$bzMU1DjzfwhJV4isfve.futvVda2oam2sIcDjMSHvh9IFyMDiq5fy',
    'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    'Super Administrador Prueba',
    3
);

-- REPORTES DE PRUEBA (estado_id mapeado a 1, 2 o 3)
INSERT INTO reporte (
    id,
    nombre,
    descripcion,
    longitud,
    latitud,
    portada,
    evidencia,
    precio,
    zona,
    contacto_ofertante,
    usuario_id,
    fuente_id,
    estado_id,
    tipo_propiedad_id,
    tipo_fraude_id
) VALUES
-- Reporte 1
(
    'a1111111-1111-1111-1111-111111111111',
    'Departamento sospechoso en Airbnb',
    'El supuesto propietario solicita depósito fuera de Airbnb.',
    -99.133209,
    19.432608,
    'test_portada_1.jpg',
    'test_evidencia_1.jpg',
    8500.00,
    'Centro',
    '5551234567',
    '11111111-1111-1111-1111-111111111111',
    1,
    1,
    1,
    3
),

-- Reporte 2
(
    'a2222222-2222-2222-2222-222222222222',
    'Casa falsa en Booking',
    'El anuncio utiliza fotografías de otra propiedad.',
    -99.167664,
    19.427225,
    'test_portada_2.jpg',
    'test_evidencia_2.jpg',
    12000.00,
    'Roma Norte',
    '5559876543',
    '11111111-1111-1111-1111-111111111111',
    2,
    2,
    2,
    2
),

-- Reporte 3
(
    'a3333333-3333-3333-3333-333333333333',
    'Habitación inexistente',
    'El anuncio desapareció después de realizar el pago.',
    -99.180000,
    19.400000,
    'test_portada_3.jpg',
    'test_evidencia_3.jpg',
    5000.00,
    'Coyoacán',
    '5551112233',
    '22222222-2222-2222-2222-222222222222',
    1,
    3,
    3,
    1
),

-- Reporte 4
(
    'a4444444-4444-4444-4444-444444444444',
    'Villa con fotos engañosas',
    'Las fotografías del anuncio no corresponden con la propiedad.',
    -99.150000,
    19.450000,
    'test_portada_4.jpg',
    'test_evidencia_4.jpg',
    15000.00,
    'Polanco',
    '5554445566',
    '22222222-2222-2222-2222-222222222222',
    3,
    2,
    4,
    4
),

-- Reporte 5
(
    'a5555555-5555-5555-5555-555555555555',
    'Cabaña sospechosa en Facebook',
    'El vendedor solicita un depósito antes de mostrar la propiedad.',
    -99.120000,
    19.460000,
    'test_portada_5.jpg',
    'test_evidencia_5.jpg',
    3000.00,
    'Tlalpan',
    '5557778899',
    '11111111-1111-1111-1111-111111111111',
    4,
    1,
    5,
    5
),

-- Reporte 6
(
    'a6666666-6666-6666-6666-666666666666',
    'Departamento con doble reservación',
    'La misma propiedad aparece reservada para diferentes personas.',
    -99.140000,
    19.440000,
    'test_portada_6.jpg',
    'test_evidencia_6.jpg',
    9000.00,
    'Condesa',
    '5552223344',
    '22222222-2222-2222-2222-222222222222',
    1,
    3,
    1,
    5
);