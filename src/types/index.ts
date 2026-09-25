export type SectorType = 
  | 'Comercio y Servicios'
  | 'Agroalimentario e Industria'
  | 'Servicios Profesionales'
  | 'Administración General';

export type NumEmpleadosType = '1–5' | '6–20' | '21–50' | 'Más de 50';

export type EcosistemaType = 'Google' | 'Microsoft' | 'Independiente';

export type AgujeroType = 'Tiempo' | 'Procesos' | 'Datos' | 'Cliente';

export type CuadranteType = 'Oro' | 'Cuello de botella' | 'Grasa' | 'Zombi';

export type NivelFlight = 'N1' | 'N2' | 'N3';

export type SemaforoColor = 'rojo' | 'amarillo' | 'verde';

export interface Sesion {
  id: string;
  codigo: string;
  nombre: string;
  edicion: string;
  fecha: string;
  titulo_bienvenida: string;
  subtitulo_bienvenida: string;
  texto_consentimiento: string;
  etapa_autorizada: number; // 1, 2, 3, 4 (Controlled ONLY by Facilitator!)
  logos_url?: string[];
  revelado_bloques: Record<string, boolean>;
}

export interface Empresa {
  id: string;
  nombre: string;
  sector: SectorType;
  num_empleados: NumEmpleadosType;
  ecosistema: EcosistemaType;
  herramientas_desuso?: string;
}

export interface Participante {
  id: string;
  sesion_id: string;
  empresa_id: string;
  nombre: string;
  cargo?: string;
  consentimiento_aceptado: boolean;
  paso_actual: number; // 1, 2, 3, 4
  pregunta_pendiente: string;
  estado: 'en_curso' | 'completado' | 'informe_revisado' | 'pdf_generado';
  token_dispositivo: string;
  empresa?: Empresa;
}

export interface Mensaje {
  id: string;
  participante_id: string;
  rol: 'agente' | 'participante';
  texto: string;
  paso: number;
  opciones_chips?: ChipOption[];
  creado_en?: string;
}

export interface ChipOption {
  id: string;
  label: string;
  value: string | number;
  meta?: Record<string, any>;
}

export interface Caso {
  case_id: string;
  ronda: number;
  agujero: AgujeroType;
  texto_base: string;
}

export interface EleccionCaso {
  ronda: number;
  case_id_primera: string;
  case_id_segunda: string;
}

export interface IntensidadAgujero {
  agujero: AgujeroType;
  intensidad: number; // 1 to 5
}

export interface TareaCatalogo {
  id: string;
  nombre: string;
  area: string;
  nivel: NivelFlight;
  activa?: boolean;
}

export interface TareaParticipante {
  id?: string;
  participante_id?: string;
  tarea_id?: string;
  nombre_personalizado?: string;
  nombre?: string;
  area: string;
  nivel: NivelFlight;
  frecuencia: 'Diaria' | 'Varias veces por semana' | 'Semanal' | 'Mensual' | 'Ocasional';
  valor: 'No pasa nada' | 'Una molestia interna' | 'El cliente lo nota' | 'Perdemos una venta o dinero';
  horas_semana: number;
  cuadrante?: CuadranteType;
  prioridad?: number;
}

export interface RespuestaNivel {
  pregunta_id: string; // F1..F9
  opcion_elegida: number; // 0..3
  puntos: number;
}

export interface HojaRutaAccion {
  plazo: '30_dias' | '60_dias' | '90_dias';
  titulo: string;
  color_semaforo: SemaforoColor;
  descripcion: string;
  que_hacer: string;
  por_que: string;
  tareas_relacionadas: string[];
  herramientas_recomendadas: Herramienta[];
}

export interface HojaRuta {
  acciones_30: HojaRutaAccion;
  acciones_60: HojaRutaAccion;
  acciones_90: HojaRutaAccion;
}

export interface AlertaCoherencia {
  tipo: string;
  mensaje: string;
  es_solido?: boolean;
}

export interface ResultadoDiagnostico {
  participante_id: string;
  empresa_id: string;
  fuga_tiempo: number;
  fuga_procesos: number;
  fuga_datos: number;
  fuga_cliente: number;
  fugas: Record<AgujeroType, number>;
  agujero_principal: AgujeroType;
  salud_n1: number;
  salud_n2: number;
  salud_n3: number;
  nivel_debil: NivelFlight;
  semaforo: SemaforoColor;
  horas_recuperables: number;
  hoja_ruta: HojaRuta;
  alertas: AlertaCoherencia[];
  version_reglas: string;
}

export interface Herramienta {
  id: string;
  nombre: string;
  categoria: string;
  cuadrantes: CuadranteType[];
  niveles: NivelFlight[];
  tamano_recomendado: NumEmpleadosType[];
  tramo_precio: string;
  ecosistema: EcosistemaType;
  descripcion: string;
}

export interface InformeEmpresa {
  id?: string;
  empresa_id: string;
  resumen_ejecutivo: string;
  texto_acciones?: Record<string, string>;
  editado_por_facilitador: boolean;
  pdf_generado_en?: string;
}
