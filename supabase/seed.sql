-- Seed data for CordobIA Digital Transformation Diagnosis App

-- Default Session
INSERT INTO sesion (id, codigo, nombre, edicion, fecha, titulo_bienvenida, subtitulo_bienvenida)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'CORDOBIA2026',
    'Córdoba IA – Grupo 1',
    'Córdoba IA 2026',
    CURRENT_DATE,
    'Transformando nuestro modelo de negocio – Córdoba IA',
    'Un diagnóstico guiado de unos 25 minutos'
) ON CONFLICT (codigo) DO NOTHING;

-- Cases (Agujeros del balde)
INSERT INTO caso (case_id, ronda, agujero, texto_base) VALUES
('R1_T', 1, 'Tiempo', 'Termino el día habiendo contestado 40 WhatsApps y pasado facturas a Excel, pero sin haber vendido nada nuevo.'),
('R1_P', 1, 'Procesos', 'Cuando me voy de vacaciones me llaman cada día porque sin mí nadie sabe cómo seguir.'),
('R1_D', 1, 'Datos', 'Vendo más que el año pasado, pero no sé si gano más; me entero cuando cierra el gestor.'),
('R1_C', 1, 'Cliente', 'Trato igual al que me compra cada semana que al que vino una vez, y no sé quién está dejando de comprar.'),
('R2_T', 2, 'Tiempo', 'Paso horas copiando datos de un sitio a otro: del email al Excel, del Excel a la factura.'),
('R2_P', 2, 'Procesos', 'Cada persona hace las cosas a su manera; si entra alguien nuevo tarda meses en aprender porque nada está escrito.'),
('R2_D', 2, 'Datos', 'Para saber cuánto stock tengo o cuánto he facturado este mes tengo que preguntar o hacer cuentas a mano.'),
('R2_C', 2, 'Cliente', 'Los presupuestos que enviamos se quedan sin seguimiento; no sé cuántos se pierden por no volver a llamar.'),
('R3_T', 3, 'Tiempo', 'Mi mejor gente pasa el día en tareas administrativas en lugar de atender clientes.'),
('R3_P', 3, 'Procesos', 'Los errores se repiten: pedidos mal preparados, información que se pierde entre departamentos.'),
('R3_D', 3, 'Datos', 'Tomo decisiones importantes, como contratar o invertir, por intuición porque los números llegan tarde.'),
('R3_C', 3, 'Cliente', 'No sé qué clientes me dejan más margen ni cuáles han dejado de comprarme.')
ON CONFLICT (case_id) DO NOTHING;

-- Tareas Catálogo Base
INSERT INTO tarea_catalogo (id, nombre, area, nivel) VALUES
('T01', 'Responder consultas frecuentes de clientes (WhatsApp, email)', 'Atención al cliente', 'N1'),
('T02', 'Clasificar y archivar documentos', 'Administración', 'N1'),
('T03', 'Registrar y conciliar facturas', 'Facturación', 'N1'),
('T04', 'Elaborar informes técnicos o periciales', 'Operaciones', 'N1'),
('T05', 'Prever demanda y gestionar stock', 'Operaciones', 'N2'),
('T06', 'Seguimiento de clientes y presupuestos enviados', 'Ventas', 'N2'),
('T07', 'Crear contenido de marketing y redes', 'Marketing', 'N1'),
('T08', 'Preparar propuestas comerciales y presupuestos', 'Ventas', 'N1'),
('T09', 'Buscar información interna dispersa', 'Transversal', 'N1'),
('T10', 'Redactar emails estándar y repetitivos', 'Transversal', 'N1'),
('T11', 'Pasar pedidos cerrados a producción o almacén', 'Ventas → Operaciones', 'N2'),
('T12', 'Emitir la factura tras la entrega', 'Operaciones → Facturación', 'N2'),
('T13', 'Revisar los números del negocio para decidir', 'Dirección', 'N3')
ON CONFLICT (id) DO NOTHING;

-- Herramientas Recomendadas
INSERT INTO herramienta (id, nombre, categoria, cuadrantes, niveles, tamano_recomendado, tramo_precio, ecosistema, descripcion) VALUES
('h01', 'Tidio / Manychat', 'Atención y consultas', ARRAY['Zombi'], ARRAY['N1'], ARRAY['1–5', '6–20', '21–50'], 'Gratis / Bajo', 'Independiente', 'Chatbots con IA para cualificar clientes y responder dudas 24/7 en WhatsApp y Web.'),
('h02', 'Make / n8n / Zapier', 'Automatización', ARRAY['Zombi', 'Grasa'], ARRAY['N1', 'N2'], ARRAY['1–5', '6–20', '21–50', 'Más de 50'], 'Gratis / Bajo', 'Independiente', 'Conecta aplicaciones (email, facturas, CRM, WhatsApp) sin programar nada.'),
('h03', 'Google Drive + Gemini / Copilot', 'Documentos & Emails', ARRAY['Zombi', 'Grasa'], ARRAY['N1'], ARRAY['1–5', '6–20', '21–50', 'Más de 50'], 'Bajo / Medio', 'Google / Microsoft', 'Búsqueda inteligente de información y generación de emails o documentos en un clic.'),
('h04', 'Dext / Rossum', 'Facturación e I.A.', ARRAY['Zombi'], ARRAY['N1'], ARRAY['1–5', '6–20', '21–50'], 'Bajo / Medio', 'Independiente', 'Extracción automática de datos de facturas físicas o PDF directos al gestor.'),
('h05', 'HubSpot / Pipedrive / Zoho', 'CRM & Ventas', ARRAY['Cuello de botella'], ARRAY['N2'], ARRAY['1–5', '6–20', '21–50', 'Más de 50'], 'Gratis / Bajo / Medio', 'Independiente', 'Seguimiento de presupuestos y gestión de oportunidades comerciales en equipo.'),
('h06', 'Odoo / Holded / Alegra', 'ERP & Operaciones', ARRAY['Cuello de botella'], ARRAY['N2'], ARRAY['1–5', '6–20', '21–50'], 'Bajo / Medio', 'Independiente', 'Gestión unificada de ventas, stock, facturación y operaciones en un solo software.'),
('h07', 'Trello / Asana / monday.com', 'Tablero de Coordinación', ARRAY['Cuello de botella'], ARRAY['N2'], ARRAY['1–5', '6–20', '21–50'], 'Gratis / Bajo', 'Independiente', 'Visibilidad total del estado de proyectos y tareas operativas entre personas.'),
('h08', 'Looker Studio / Power BI', 'Dashboards y Análisis', ARRAY['Oro'], ARRAY['N3'], ARRAY['1–5', '6–20', '21–50', 'Más de 50'], 'Gratis / Medio', 'Google / Microsoft', 'Paneles visuales en tiempo real para tomar decisiones estratégicas basadas en datos.')
ON CONFLICT (id) DO NOTHING;
