USE railway;
-- Script de población de base de datos para sistema de donaciones
-- Este script asume que las tablas ya han sido creadas mediante migraciones o sincronización de TypeORM

-- Configurar ajustes iniciales
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


-- Limpiar tablas existentes (opcional, comentar si no se desea limpiar)
TRUNCATE TABLE usuarios;
TRUNCATE TABLE campanas;
TRUNCATE TABLE donaciones;
TRUNCATE TABLE suscripciones;
TRUNCATE TABLE comprobantes;
TRUNCATE TABLE facturas;
TRUNCATE TABLE datos_fiscales;
TRUNCATE TABLE metodos_pago;
TRUNCATE TABLE configuraciones;
TRUNCATE TABLE notificaciones;
TRUNCATE TABLE recompensas;
TRUNCATE TABLE usuarios_recompensas;
TRUNCATE TABLE estadisticas_mensuales;

-- -----------------------------------------------------
-- Configuraciones del sistema
-- -----------------------------------------------------
INSERT INTO configuraciones (clave, valor, descripcion, tipo, editable, fecha_actualizacion) VALUES 
('montos_predeterminados', '5,10,20,50,100,200', 'Montos predeterminados para donaciones', 'texto', 1, NOW()),
('moneda_principal', 'USD', 'Moneda principal del sistema', 'texto', 1, NOW()),
('titulo_sitio', 'Sistema de Donaciones Ecuador', 'Título del sitio web', 'texto', 1, NOW()),
('meta_mensual', '10000', 'Meta mensual de recaudación', 'numero', 1, NOW()),
('mensaje_donacion', 'Gracias por tu donación. Tu aporte hace la diferencia.', 'Mensaje a mostrar después de una donación', 'texto', 1, NOW()),
('puntos_por_dolar', '1', 'Puntos otorgados por cada dólar donado', 'numero', 1, NOW()),
('limite_intentos_pago', '3', 'Límite de intentos de pago fallidos', 'numero', 1, NOW()),
('colores_tema', '{"primario":"#3498db","secundario":"#2ecc71","acento":"#e74c3c"}', 'Colores del tema visual', 'json', 1, NOW()),
('comision_plux', '0.035', 'Comisión de PLUX por transacción', 'numero', 1, NOW()),
('umbral_nivel_plata', '200', 'Puntos necesarios para nivel Plata', 'numero', 1, NOW()),
('umbral_nivel_oro', '500', 'Puntos necesarios para nivel Oro', 'numero', 1, NOW()),
('umbral_nivel_platino', '1000', 'Puntos necesarios para nivel Platino', 'numero', 1, NOW());


SELECT * FROM USUARIOS
-- -----------------------------------------------------
-- Usuarios
-- -----------------------------------------------------
-- Contraseña: "password123" encriptada con bcrypt
INSERT INTO usuarios (nombres, apellidos, cedula, fecha_nacimiento, direccion, ciudad, provincia, telefono, correo, password, fecha_registro, ultimo_login, activo, puntos_acumulados, nivel_donante) VALUES 
('Carlos', 'Rodríguez', '1712345678', '1990-05-15', 'Av. Amazonas N36-152', 'Quito', 'Pichincha', '0991234567', 'carlos@ejemplo.com', '$2b$10$rNCLcBlOhdl9.7xQ1oJ1C.7sKT90iFXgy6JTeqrJHX9UDR2m/Yyxy', NOW(), NOW(), 1, 50, 'Bronce'),
('Ana', 'Martínez', '1798765432', '1985-10-22', 'Calle Toledo 345', 'Quito', 'Pichincha', '0987654321', 'ana@ejemplo.com', '$2b$10$rNCLcBlOhdl9.7xQ1oJ1C.7sKT90iFXgy6JTeqrJHX9UDR2m/Yyxy', '2023-01-15', NOW(), 1, 750, 'Oro'),
('Admin', 'Sistema', '1700123456', '1988-03-10', 'Oficina Central', 'Quito', 'Pichincha', '0998887777', 'admin@admin.com', '$2b$10$rNCLcBlOhdl9.7xQ1oJ1C.7sKT90iFXgy6JTeqrJHX9UDR2m/Yyxy', '2022-12-01', NOW(), 1, 0, 'Bronce');

-- -----------------------------------------------------
-- Campañas
-- -----------------------------------------------------
INSERT INTO campanas (nombre, descripcion, imagen_url, meta_monto, monto_recaudado, es_emergencia, fecha_inicio, fecha_fin, estado, impacto_descripcion, contador_donaciones) VALUES 
('Apoyo a familias damnificadas', 'Ayuda a familias afectadas por las inundaciones en la costa ecuatoriana. Los fondos serán utilizados para la compra de alimentos, medicinas y materiales de construcción.', '/img/campanas/inundaciones.jpg', 15000.00, 9280.50, 1, '2023-03-01', '2023-08-31', 'Activa', '$20 = Kit de alimentos para 1 familia por 1 semana', 125),
('Educación para todos', 'Programa de becas para niños y jóvenes de escasos recursos que necesitan apoyo para continuar sus estudios. Las becas cubren material escolar, uniformes y transporte.', '/img/campanas/educacion.jpg', 25000.00, 12450.75, 0, '2023-01-15', '2023-12-31', 'Activa', '$50 = Kit escolar completo para 1 niño', 75),
('Refugio para animales', 'Ayuda a mantener nuestro refugio para animales abandonados. Los fondos se utilizan para alimentación, atención veterinaria y mejoras en las instalaciones.', '/img/campanas/animales.jpg', 10000.00, 3570.25, 0, '2023-02-10', '2023-07-31', 'Activa', '$10 = Alimento para 1 animal durante 1 semana', 93),
('Reforestación Amazonía', 'Proyecto de reforestación en áreas degradadas de la Amazonía ecuatoriana. Se plantarán especies nativas y se capacitará a comunidades locales para su mantenimiento.', '/img/campanas/reforestacion.jpg', 30000.00, 8920.00, 0, '2023-04-15', '2023-12-31', 'Activa', '$25 = 10 árboles nativos plantados', 56),
('Emergencia terremoto Manabí', 'Ayuda urgente para las familias afectadas por el reciente terremoto en la provincia de Manabí. Se necesitan alimentos, agua, medicinas y carpas.', '/img/campanas/terremoto.jpg', 20000.00, 18750.50, 1, '2023-05-10', '2023-06-30', 'Activa', '$15 = Kit de emergencia básico para 1 persona', 210);

-- -----------------------------------------------------
-- Métodos de Pago
-- -----------------------------------------------------
INSERT INTO metodos_pago (id_usuario, tipo, token_referencia, alias, ultimo_digitos, banco, tipo_cuenta, activo, fecha_registro, ultima_actualizacion) VALUES 
(1, 'Tarjeta', 'tok_visa_encriptado123', 'Mi Visa Personal', '4321', 'Banco Pichincha', 'Corriente', 1, NOW(), NOW()),
(2, 'Tarjeta', 'tok_mastercard_encriptado456', 'Mastercard Principal', '8765', 'Banco Guayaquil', 'Ahorros', 1, NOW(), NOW()),
(2, 'PayPal', 'pp_token_789', 'Mi cuenta PayPal', NULL, NULL, NULL, 1, NOW(), NOW());

-- -----------------------------------------------------
-- Donaciones
-- -----------------------------------------------------
INSERT INTO donaciones (id_usuario, id_campana, monto, moneda, fecha_donacion, metodo_pago, referencia_pago, estado, es_anonima, requiere_factura, correo_comprobante, acepto_terminos, acepto_noticias, id_suscripcion, puntos_otorgados, ip_donante, notas) VALUES 
(1, 1, 50.00, 'USD', DATE_SUB(NOW(), INTERVAL 15 DAY), 'Tarjeta', 'ref_123456', 'Completada', 0, 0, 'carlos@ejemplo.com', 1, 1, NULL, 50, '192.168.1.100', NULL),
(2, 1, 200.00, 'USD', DATE_SUB(NOW(), INTERVAL 25 DAY), 'Tarjeta', 'ref_234567', 'Completada', 0, 1, 'ana@ejemplo.com', 1, 1, NULL, 200, '192.168.1.101', NULL),
(2, 2, 100.00, 'USD', DATE_SUB(NOW(), INTERVAL 20 DAY), 'Tarjeta', 'ref_345678', 'Completada', 0, 1, 'ana@ejemplo.com', 1, 1, NULL, 100, '192.168.1.101', NULL),
(2, 3, 75.00, 'USD', DATE_SUB(NOW(), INTERVAL 15 DAY), 'PayPal', 'ref_456789', 'Completada', 0, 0, 'ana@ejemplo.com', 1, 1, NULL, 75, '192.168.1.101', NULL),
(2, 4, 150.00, 'USD', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Tarjeta', 'ref_567890', 'Completada', 0, 1, 'ana@ejemplo.com', 1, 1, NULL, 150, '192.168.1.101', NULL),
(2, 5, 225.00, 'USD', DATE_SUB(NOW(), INTERVAL 5 DAY), 'PayPal', 'ref_678901', 'Completada', 0, 0, 'ana@ejemplo.com', 1, 1, NULL, 225, '192.168.1.101', NULL),
(NULL, 1, 25.00, 'USD', DATE_SUB(NOW(), INTERVAL 8 DAY), 'Tarjeta', 'ref_789012', 'Completada', 1, 0, 'donante.anonimo@gmail.com', 1, 0, NULL, 0, '192.168.1.102', NULL),
(NULL, 5, 50.00, 'USD', DATE_SUB(NOW(), INTERVAL 3 DAY), 'PLUX', 'ref_890123', 'Completada', 1, 0, 'otro.anonimo@gmail.com', 1, 0, NULL, 0, '192.168.1.103', NULL);

-- -----------------------------------------------------
-- Comprobantes
-- -----------------------------------------------------
INSERT INTO comprobantes (id_donacion, codigo_unico, fecha_emision, url_pdf, enviado_email, fecha_envio, correo_envio) VALUES 
(1, 'COMP-2023-00001', DATE_SUB(NOW(), INTERVAL 15 DAY), '/comprobantes/COMP-2023-00001.pdf', 1, DATE_SUB(NOW(), INTERVAL 15 DAY), 'carlos@ejemplo.com'),
(2, 'COMP-2023-00002', DATE_SUB(NOW(), INTERVAL 25 DAY), '/comprobantes/COMP-2023-00002.pdf', 1, DATE_SUB(NOW(), INTERVAL 25 DAY), 'ana@ejemplo.com'),
(3, 'COMP-2023-00003', DATE_SUB(NOW(), INTERVAL 20 DAY), '/comprobantes/COMP-2023-00003.pdf', 1, DATE_SUB(NOW(), INTERVAL 20 DAY), 'ana@ejemplo.com'),
(4, 'COMP-2023-00004', DATE_SUB(NOW(), INTERVAL 15 DAY), '/comprobantes/COMP-2023-00004.pdf', 1, DATE_SUB(NOW(), INTERVAL 15 DAY), 'ana@ejemplo.com'),
(5, 'COMP-2023-00005', DATE_SUB(NOW(), INTERVAL 10 DAY), '/comprobantes/COMP-2023-00005.pdf', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), 'ana@ejemplo.com'),
(6, 'COMP-2023-00006', DATE_SUB(NOW(), INTERVAL 5 DAY), '/comprobantes/COMP-2023-00006.pdf', 1, DATE_SUB(NOW(), INTERVAL 5 DAY), 'ana@ejemplo.com'),
(7, 'COMP-2023-00007', DATE_SUB(NOW(), INTERVAL 8 DAY), '/comprobantes/COMP-2023-00007.pdf', 1, DATE_SUB(NOW(), INTERVAL 8 DAY), 'donante.anonimo@gmail.com'),
(8, 'COMP-2023-00008', DATE_SUB(NOW(), INTERVAL 3 DAY), '/comprobantes/COMP-2023-00008.pdf', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), 'otro.anonimo@gmail.com');

-- -----------------------------------------------------
-- Datos Fiscales
-- -----------------------------------------------------
INSERT INTO datos_fiscales (id_usuario, rfc, razon_social, direccion_fiscal, correo_facturacion, requiere_cfdi, fecha_registro, ultima_actualizacion) VALUES 
(2, '1798765432001', 'Ana Martínez', 'Calle Toledo 345, Quito, Pichincha', 'ana@ejemplo.com', 0, NOW(), NOW());

-- -----------------------------------------------------
-- Facturas
-- -----------------------------------------------------
INSERT INTO facturas (id_donacion, id_datos_fiscales, numero_factura, fecha_emision, subtotal, impuestos, total, url_pdf, enviada_email, fecha_envio, enviada_sat, estado) VALUES 
(2, 1, 'FAC-2023-00001', DATE_SUB(NOW(), INTERVAL 25 DAY), 200.00, 0.00, 200.00, '/facturas/FAC-2023-00001.pdf', 1, DATE_SUB(NOW(), INTERVAL 25 DAY), 0, 'Emitida'),
(3, 1, 'FAC-2023-00002', DATE_SUB(NOW(), INTERVAL 20 DAY), 100.00, 0.00, 100.00, '/facturas/FAC-2023-00002.pdf', 1, DATE_SUB(NOW(), INTERVAL 20 DAY), 0, 'Emitida'),
(5, 1, 'FAC-2023-00003', DATE_SUB(NOW(), INTERVAL 10 DAY), 150.00, 0.00, 150.00, '/facturas/FAC-2023-00003.pdf', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), 0, 'Emitida');

-- -----------------------------------------------------
-- Suscripciones
-- -----------------------------------------------------
INSERT INTO suscripciones (id_usuario, id_campana, monto, frecuencia, fecha_inicio, fecha_fin, proxima_donacion, estado, id_metodo_pago, total_donado, total_donaciones, fecha_creacion, ultima_actualizacion) VALUES 
(2, 2, 50.00, 'Mensual', DATE_SUB(NOW(), INTERVAL 2 MONTH), NULL, DATE_ADD(NOW(), INTERVAL 1 MONTH), 'Activa', 2, 100.00, 2, DATE_SUB(NOW(), INTERVAL 2 MONTH), NOW()),
(2, 4, 100.00, 'Trimestral', DATE_SUB(NOW(), INTERVAL 3 MONTH), NULL, DATE_ADD(NOW(), INTERVAL 3 DAY), 'Activa', 3, 100.00, 1, DATE_SUB(NOW(), INTERVAL 3 MONTH), NOW());

-- -----------------------------------------------------
-- Notificaciones
-- -----------------------------------------------------
INSERT INTO notificaciones (id_usuario, tipo, titulo, mensaje, leida, fecha_creacion, fecha_lectura) VALUES 
(1, 'Donacion', 'Donación exitosa', 'Tu donación de $50.00 para la campaña "Apoyo a familias damnificadas" ha sido procesada exitosamente.', 1, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY)),
(2, 'Donacion', 'Donación exitosa', 'Tu donación de $200.00 para la campaña "Apoyo a familias damnificadas" ha sido procesada exitosamente.', 1, DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 25 DAY)),
(2, 'Donacion', 'Donación exitosa', 'Tu donación de $100.00 para la campaña "Educación para todos" ha sido procesada exitosamente.', 1, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),
(2, 'Donacion', 'Donación exitosa', 'Tu donación de $75.00 para la campaña "Refugio para animales" ha sido procesada exitosamente.', 1, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY)),
(2, 'Donacion', 'Donación exitosa', 'Tu donación de $150.00 para la campaña "Reforestación Amazonía" ha sido procesada exitosamente.', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2, 'Donacion', 'Donación exitosa', 'Tu donación de $225.00 para la campaña "Emergencia terremoto Manabí" ha sido procesada exitosamente.', 0, DATE_SUB(NOW(), INTERVAL 5 DAY), NULL),
(2, 'Suscripcion', 'Nueva suscripción', 'Tu suscripción mensual de $50.00 para la campaña "Educación para todos" ha sido activada.', 1, DATE_SUB(NOW(), INTERVAL 2 MONTH), DATE_SUB(NOW(), INTERVAL 2 MONTH)),
(2, 'Suscripcion', 'Próxima donación programada', 'Tu próxima donación de $100.00 para la campaña "Reforestación Amazonía" está programada para dentro de 3 días.', 0, NOW(), NULL),
(2, 'Sistema', '¡Felicidades! Has subido de nivel', 'Has alcanzado el nivel Oro. Gracias por tu generoso apoyo continuo.', 0, DATE_SUB(NOW(), INTERVAL 5 DAY), NULL),
(1, 'Campana', 'Actualización de campaña', 'La campaña "Apoyo a familias damnificadas" ha alcanzado el 50% de su meta. ¡Gracias por tu apoyo!', 0, DATE_SUB(NOW(), INTERVAL 7 DAY), NULL);

-- -----------------------------------------------------
-- Recompensas
-- -----------------------------------------------------
INSERT INTO recompensas (nombre, descripcion, puntos_requeridos, tipo, imagen_url, activa, cantidad_disponible, fecha_creacion) VALUES 
('Insignia Bronce', 'Insignia digital de nivel Bronce', 10, 'Insignia', '/img/recompensas/insignia-bronce.png', 1, NULL, NOW()),
('Insignia Plata', 'Insignia digital de nivel Plata', 200, 'Insignia', '/img/recompensas/insignia-plata.png', 1, NULL, NOW()),
('Insignia Oro', 'Insignia digital de nivel Oro', 500, 'Insignia', '/img/recompensas/insignia-oro.png', 1, NULL, NOW()),
('Insignia Platino', 'Insignia digital de nivel Platino', 1000, 'Insignia', '/img/recompensas/insignia-platino.png', 1, NULL, NOW()),
('Certificado de Donante', 'Certificado digital personalizado de reconocimiento', 300, 'Certificado', '/img/recompensas/certificado.png', 1, NULL, NOW()),
('Visita guiada a proyectos', 'Visita guiada a uno de nuestros proyectos en Ecuador', 800, 'Experiencia', '/img/recompensas/visita.png', 1, 20, NOW()),
('Descuento 10% en tienda solidaria', 'Cupón de descuento para nuestra tienda solidaria', 150, 'Descuento', '/img/recompensas/descuento.png', 1, 50, NOW());

-- -----------------------------------------------------
-- Usuarios Recompensas
-- -----------------------------------------------------
INSERT INTO usuarios_recompensas (id_usuario, id_recompensa, fecha_obtencion, puntos_usados, codigo_unico, estado, fecha_entrega, notas) VALUES 
(1, 1, DATE_SUB(NOW(), INTERVAL 15 DAY), 10, 'INSIG-2023-00001', 'Entregada', DATE_SUB(NOW(), INTERVAL 15 DAY), 'Entregada automáticamente'),
(2, 1, DATE_SUB(NOW(), INTERVAL 3 MONTH), 10, 'INSIG-2023-00002', 'Entregada', DATE_SUB(NOW(), INTERVAL 3 MONTH), 'Entregada automáticamente'),
(2, 2, DATE_SUB(NOW(), INTERVAL 2 MONTH), 200, 'INSIG-2023-00003', 'Entregada', DATE_SUB(NOW(), INTERVAL 2 MONTH), 'Entregada automáticamente'),
(2, 3, DATE_SUB(NOW(), INTERVAL 1 MONTH), 500, 'INSIG-2023-00004', 'Entregada', DATE_SUB(NOW(), INTERVAL 1 MONTH), 'Entregada automáticamente'),
(2, 5, DATE_SUB(NOW(), INTERVAL 15 DAY), 300, 'CERT-2023-00001', 'Entregada', DATE_SUB(NOW(), INTERVAL 15 DAY), 'Certificado enviado por email'),
(2, 7, DATE_SUB(NOW(), INTERVAL 10 DAY), 150, 'DESC-2023-00001', 'Pendiente', NULL, 'Pendiente de uso');

-- -----------------------------------------------------
-- Estadísticas Mensuales FALTARIA
-- -----------------------------------------------------
INSERT INTO estadisticas_mensuales (ano, mes, total_donaciones, contador_donaciones, contador_donantes_unicos, contador_nuevos_donantes, contador_suscripciones_nuevas, contador_suscripciones_canceladas, campana_principal, monto_promedio) VALUES 
(2023, 1, 5000.00, 30, 25, 10, 5, 1, 2, 166.67),
(2023, 2, 7500.00, 45, 35, 15, 8, 2, 3, 166.67),
(2023, 3, 12000.00, 70, 50, 20, 10, 3, 1, 171.43),
(2023, 4, 8500.00, 55, 40, 8, 7, 2, 4, 154.55),
(2023, 5, 15000.00, 100, 80, 25, 12, 1, 5, 150.00);

-- Activar de nuevo las restricciones de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;