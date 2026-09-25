import {
  Empresa,
  InformeEmpresa,
  Mensaje,
  Participante,
  ResultadoDiagnostico,
  Sesion,
  TareaParticipante
} from '@/types';
import { CATALOGO_HERRAMIENTAS, generarDiagnosticoCompleto } from '@/lib/rules-engine';

// In-Memory state store for local preview / offline support
export class LocalMockStore {
  private static instance: LocalMockStore;

  public sesion: Sesion = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    codigo: 'CORDOBIA2026',
    nombre: 'Córdoba IA – Grupo 1',
    edicion: 'Córdoba IA 2026',
    fecha: new Date().toISOString().split('T')[0],
    titulo_bienvenida: 'Transformando nuestro modelo de negocio – Córdoba IA',
    subtitulo_bienvenida: 'Un diagnóstico guiado de unos 25 minutos',
    texto_consentimiento: 'Doy mi consentimiento para el tratamiento de datos según la política RGPD del taller.',
    revelado_bloques: { b1: true, b2: true, b3: true, b4: true, b5: true, b6: true, b7: false }
  };

  public empresas: Map<string, Empresa> = new Map();
  public participantes: Map<string, Participante> = new Map();
  public mensajes: Map<string, Mensaje[]> = new Map();
  public resultados: Map<string, ResultadoDiagnostico> = new Map();
  public informes: Map<string, InformeEmpresa> = new Map();
  public tareasParticipante: Map<string, TareaParticipante[]> = new Map();

  private constructor() {
    this.seedMockData();
  }

  public static getInstance(): LocalMockStore {
    if (!LocalMockStore.instance) {
      LocalMockStore.instance = new LocalMockStore();
    }
    return LocalMockStore.instance;
  }

  private seedMockData() {
    // Seed 4 demo companies & participants for live dashboard demonstration
    const demoCompanies: Empresa[] = [
      {
        id: 'emp-1',
        nombre: 'Panadería Artesanal El Trigo',
        sector: 'Agroalimentario e Industria',
        num_empleados: '6–20',
        ecosistema: 'Google',
        herramientas_desuso: 'Excel de control de stock abandonado'
      },
      {
        id: 'emp-2',
        nombre: 'Consultoría Técnica Innova',
        sector: 'Servicios Profesionales',
        num_empleados: '1–5',
        ecosistema: 'Microsoft',
        herramientas_desuso: 'CRM sin actualizar desde 2023'
      },
      {
        id: 'emp-3',
        nombre: 'Calzados y Moda Córdoba',
        sector: 'Comercio y Servicios',
        num_empleados: '6–20',
        ecosistema: 'Independiente',
        herramientas_desuso: ''
      },
      {
        id: 'emp-4',
        nombre: 'Gestoría Administrativa Sur',
        sector: 'Administración General',
        num_empleados: '21–50',
        ecosistema: 'Microsoft',
        herramientas_desuso: 'Power Automate contratado sin uso'
      }
    ];

    demoCompanies.forEach((emp, index) => {
      this.empresas.set(emp.id, emp);

      const partId = `part-${index + 1}`;
      const part: Participante = {
        id: partId,
        sesion_id: this.sesion.id,
        empresa_id: emp.id,
        nombre: `Participante ${index + 1}`,
        cargo: 'Gerente / Propietario',
        consentimiento_aceptado: true,
        paso_actual: 4,
        pregunta_pendiente: 'COMPLETADO',
        estado: 'completado',
        token_dispositivo: `token-${partId}`,
        empresa: emp
      };
      this.participantes.set(partId, part);

      // Tasks for demo company
      const demoTasks: TareaParticipante[] = [
        {
          tarea_id: 'T01',
          nombre: 'Responder consultas frecuentes de clientes (WhatsApp)',
          area: 'Atención al cliente',
          nivel: 'N1',
          frecuencia: 'Diaria',
          valor: 'El cliente lo nota',
          horas_semana: 7.5,
          cuadrante: 'Zombi'
        },
        {
          tarea_id: 'T11',
          nombre: 'Pasar pedidos cerrados a almacén',
          area: 'Ventas → Operaciones',
          nivel: 'N2',
          frecuencia: 'Diaria',
          valor: 'Perdemos una venta o dinero',
          horas_semana: 5.0,
          cuadrante: 'Cuello de botella'
        },
        {
          tarea_id: 'T13',
          nombre: 'Revisar los números del negocio para decidir',
          area: 'Dirección',
          nivel: 'N3',
          frecuencia: 'Semanal',
          valor: 'El cliente lo nota',
          horas_semana: 3.0,
          cuadrante: 'Oro'
        }
      ];
      this.tareasParticipante.set(partId, demoTasks);

      // Results using rules engine
      const res = generarDiagnosticoCompleto(
        emp,
        [
          { ronda: 1, case_id_primera: index % 2 === 0 ? 'R1_P' : 'R1_D', case_id_segunda: 'R1_T' },
          { ronda: 2, case_id_primera: index % 2 === 0 ? 'R2_P' : 'R2_T', case_id_segunda: 'R2_D' },
          { ronda: 3, case_id_primera: index % 2 === 0 ? 'R3_P' : 'R3_D', case_id_segunda: 'R3_C' },
        ],
        [
          { agujero: 'Tiempo', intensidad: 4 },
          { agujero: 'Procesos', intensidad: index % 2 === 0 ? 5 : 2 },
          { agujero: 'Datos', intensidad: index % 2 === 0 ? 3 : 5 },
          { agujero: 'Cliente', intensidad: 2 },
        ],
        demoTasks,
        [
          { pregunta_id: 'F1', opcion_elegida: 1, puntos: 1 },
          { pregunta_id: 'F2', opcion_elegida: 1, puntos: 1 },
          { pregunta_id: 'F3', opcion_elegida: 0, puntos: 0 },
          { pregunta_id: 'F4', opcion_elegida: 1, puntos: 1 },
          { pregunta_id: 'F5', opcion_elegida: 0, puntos: 0 },
          { pregunta_id: 'F6', opcion_elegida: 1, puntos: 1 },
          { pregunta_id: 'F7', opcion_elegida: 1, puntos: 1 },
          { pregunta_id: 'F8', opcion_elegida: 1, puntos: 1 },
          { pregunta_id: 'F9', opcion_elegida: 1, puntos: 1 },
        ]
      );

      res.participante_id = partId;
      res.empresa_id = emp.id;
      this.resultados.set(partId, res);

      // Report
      this.informes.set(emp.id, {
        empresa_id: emp.id,
        resumen_ejecutivo: `La empresa ${emp.nombre} presenta un diagnóstico centrado en su coordinación operativa (Nivel 2). La fuga principal identificada radica en ${res.agujero_principal}, requiriendo sistematización inmediata.`,
        editado_por_facilitador: false
      });
    });
  }
}
