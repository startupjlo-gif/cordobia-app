-- Database Schema for CordobIA Digital Transformation Diagnosis App
-- Compatible with Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SESION (Workshop Sessions)
CREATE TABLE IF NOT EXISTS sesion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    edicion VARCHAR(100) DEFAULT 'Córdoba IA',
    fecha DATE DEFAULT CURRENT_DATE,
    titulo_bienvenida VARCHAR(255) DEFAULT 'Transformando nuestro modelo de negocio – Córdoba IA',
    subtitulo_bienvenida VARCHAR(255) DEFAULT 'Un diagnóstico guiado de unos 25 minutos',
    texto_consentimiento TEXT DEFAULT 'Doy mi consentimiento para el tratamiento de datos según la política RGPD del taller.',
    logos_url TEXT[],
    revelado_bloques JSONB DEFAULT '{"b1": true, "b2": false, "b3": false, "b4": false, "b5": false, "b6": false, "b7": false}'::jsonb,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. EMPRESA (Companies)
CREATE TABLE IF NOT EXISTS empresa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    num_empleados VARCHAR(50) NOT NULL, -- '1–5', '6–20', '21–50', 'Más de 50'
    ecosistema VARCHAR(100) DEFAULT 'Independiente', -- 'Google', 'Microsoft', 'Independiente'
    herramientas_desuso TEXT DEFAULT '',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PARTICIPANTE (Participants)
CREATE TABLE IF NOT EXISTS participante (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sesion_id UUID REFERENCES sesion(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    consentimiento_aceptado BOOLEAN DEFAULT TRUE,
    fecha_consentimiento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paso_actual INT DEFAULT 1, -- 1 to 4
    pregunta_pendiente VARCHAR(100) DEFAULT 'P1_INICIO',
    estado VARCHAR(50) DEFAULT 'en_curso', -- 'en_curso', 'completado', 'informe_revisado', 'pdf_generado'
    token_dispositivo VARCHAR(255) UNIQUE DEFAULT uuid_generate_v4()::text,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. MENSAJE (Chat Messages)
CREATE TABLE IF NOT EXISTS mensaje (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participante_id UUID REFERENCES participante(id) ON DELETE CASCADE,
    rol VARCHAR(20) NOT NULL, -- 'agente' or 'participante'
    texto TEXT NOT NULL,
    paso INT NOT NULL,
    opciones_chips JSONB DEFAULT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CASO (Bucket Leaks Case Definitions)
CREATE TABLE IF NOT EXISTS caso (
    case_id VARCHAR(20) PRIMARY KEY,
    ronda INT NOT NULL,
    agujero VARCHAR(50) NOT NULL, -- 'Tiempo', 'Procesos', 'Datos', 'Cliente'
    texto_base TEXT NOT NULL
);

-- 6. ELECCION_CASO (Participant Case Selections)
CREATE TABLE IF NOT EXISTS eleccion_caso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participante_id UUID REFERENCES participante(id) ON DELETE CASCADE,
    ronda INT NOT NULL,
    case_id_primera VARCHAR(20) REFERENCES caso(case_id),
    case_id_segunda VARCHAR(20) REFERENCES caso(case_id),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. INTENSIDAD_AGUJERO (Leak Intensity Ratings)
CREATE TABLE IF NOT EXISTS intensidad_agujero (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participante_id UUID REFERENCES participante(id) ON DELETE CASCADE,
    agujero VARCHAR(50) NOT NULL,
    intensidad INT NOT NULL CHECK (intensidad BETWEEN 1 AND 5),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TAREA_CATALOGO (Task Catalog)
CREATE TABLE IF NOT EXISTS tarea_catalogo (
    id VARCHAR(20) PRIMARY KEY, -- T01, T02...
    nombre VARCHAR(255) NOT NULL,
    area VARCHAR(100) NOT NULL,
    nivel VARCHAR(10) NOT NULL, -- 'N1', 'N2', 'N3'
    activa BOOLEAN DEFAULT TRUE
);

-- 9. TAREA_PARTICIPANTE (Selected/Custom Participant Tasks)
CREATE TABLE IF NOT EXISTS tarea_participante (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participante_id UUID REFERENCES participante(id) ON DELETE CASCADE,
    tarea_id VARCHAR(20) REFERENCES tarea_catalogo(id),
    nombre_personalizado TEXT,
    area VARCHAR(100) NOT NULL,
    nivel VARCHAR(10) NOT NULL,
    frecuencia VARCHAR(50) NOT NULL, -- 'Diaria', 'Varias veces por semana', 'Semanal', 'Mensual', 'Ocasional'
    valor VARCHAR(50) NOT NULL, -- 'No pasa nada', 'Una molestia interna', 'El cliente lo nota', 'Perdemos una venta o dinero'
    horas_semana NUMERIC(4,1) NOT NULL,
    cuadrante VARCHAR(50), -- 'Oro', 'Cuello de botella', 'Grasa', 'Zombi'
    prioridad NUMERIC(6,2),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. RESPUESTA_NIVEL (Flight Levels F1-F9 Responses)
CREATE TABLE IF NOT EXISTS respuesta_nivel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participante_id UUID REFERENCES participante(id) ON DELETE CASCADE,
    pregunta_id VARCHAR(10) NOT NULL, -- F1 to F9
    opcion_elegida INT NOT NULL CHECK (opcion_elegida BETWEEN 0 AND 3),
    puntos INT NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. RESULTADO (Calculated Results per Participant / Company)
CREATE TABLE IF NOT EXISTS resultado (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participante_id UUID REFERENCES participante(id) ON DELETE CASCADE UNIQUE,
    empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
    fuga_tiempo INT NOT NULL,
    fuga_procesos INT NOT NULL,
    fuga_datos INT NOT NULL,
    fuga_cliente INT NOT NULL,
    agujero_principal VARCHAR(50) NOT NULL,
    salud_n1 INT NOT NULL,
    salud_n2 INT NOT NULL,
    salud_n3 INT NOT NULL,
    nivel_debil VARCHAR(10) NOT NULL,
    semaforo VARCHAR(20) NOT NULL, -- 'rojo', 'amarillo', 'verde'
    horas_recuperables NUMERIC(5,1) NOT NULL,
    hoja_ruta JSONB NOT NULL,
    alertas JSONB DEFAULT '[]'::jsonb,
    version_reglas VARCHAR(20) DEFAULT '1.0.0',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. HERRAMIENTA (Software Tool Catalog)
CREATE TABLE IF NOT EXISTS herramienta (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    cuadrantes TEXT[],
    niveles TEXT[],
    tamano_recomendado TEXT[],
    tramo_precio VARCHAR(50),
    ecosistema VARCHAR(50),
    descripcion TEXT
);

-- 13. INFORME (Facilitator Editable Report)
CREATE TABLE IF NOT EXISTS informe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE UNIQUE,
    resumen_ejecutivo TEXT,
    texto_acciones JSONB,
    editado_por_facilitador BOOLEAN DEFAULT FALSE,
    pdf_generado_en TIMESTAMP WITH TIME ZONE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Configuration
ALTER TABLE sesion ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE participante ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultado ENABLE ROW LEVEL SECURITY;
ALTER TABLE informe ENABLE ROW LEVEL SECURITY;

-- Permissive policies for participant session code access & facilitator full access
CREATE POLICY "Public Read Sessions" ON sesion FOR SELECT USING (true);
CREATE POLICY "Public Write Participants" ON participante FOR ALL USING (true);
CREATE POLICY "Public Write Messages" ON mensaje FOR ALL USING (true);
CREATE POLICY "Public Read/Write Empresa" ON empresa FOR ALL USING (true);
CREATE POLICY "Public Read/Write Result" ON resultado FOR ALL USING (true);
CREATE POLICY "Public Read/Write Informe" ON informe FOR ALL USING (true);
