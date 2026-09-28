import {
  Empresa,
  InformeEmpresa,
  Mensaje,
  Participante,
  ResultadoDiagnostico,
  Sesion,
  TareaParticipante
} from '@/types';
import { generarDiagnosticoCompleto } from '@/lib/rules-engine';
import { supabase, isSupabaseConfigured } from './client';

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
    etapa_autorizada: 1, // Default initial stage authorized by mentor
    revelado_bloques: { b1: true, b2: true, b3: true, b4: true, b5: true, b6: true, b7: false }
  };

  public empresas: Map<string, Empresa> = new Map();
  public participantes: Map<string, Participante> = new Map();
  public mensajes: Map<string, Mensaje[]> = new Map();
  public resultados: Map<string, ResultadoDiagnostico> = new Map();
  public informes: Map<string, InformeEmpresa> = new Map();
  public tareasParticipante: Map<string, TareaParticipante[]> = new Map();

  private listenersEtapa: Set<(nuevaEtapa: number) => void> = new Set();

  private constructor() {
    this.seedMockData();
    this.loadFromLocalStorage();
  }

  public static getInstance(): LocalMockStore {
    if (!LocalMockStore.instance) {
      LocalMockStore.instance = new LocalMockStore();
    }
    return LocalMockStore.instance;
  }

  // Facilitator Master Control Action: Broadcasts stage advance to all active devices
  public autorizarEtapaFacilitador(nuevaEtapa: number) {
    this.sesion.etapa_autorizada = nuevaEtapa;
    this.saveToLocalStorage();
    this.listenersEtapa.forEach((listener) => listener(nuevaEtapa));
  }

  public onEtapaCambiada(callback: (nuevaEtapa: number) => void) {
    this.listenersEtapa.add(callback);
    return () => this.listenersEtapa.delete(callback);
  }

  public saveToLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const payload = {
        sesion: this.sesion,
        empresas: Array.from(this.empresas.entries()),
        participantes: Array.from(this.participantes.entries()),
        resultados: Array.from(this.resultados.entries()),
        informes: Array.from(this.informes.entries()),
        tareasParticipante: Array.from(this.tareasParticipante.entries()),
      };
      localStorage.setItem('cordobia_store_v1', JSON.stringify(payload));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  private loadFromLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('cordobia_store_v1');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.sesion) this.sesion = data.sesion;
      if (Array.isArray(data.empresas)) this.empresas = new Map(data.empresas);
      if (Array.isArray(data.participantes)) this.participantes = new Map(data.participantes);
      if (Array.isArray(data.resultados)) this.resultados = new Map(data.resultados);
      if (Array.isArray(data.informes)) this.informes = new Map(data.informes);
      if (Array.isArray(data.tareasParticipante)) this.tareasParticipante = new Map(data.tareasParticipante);
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
    }
  }

  public async syncToSupabase(empresa: Empresa, resultado: ResultadoDiagnostico) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      // Insert / Upsert Empresa
      await supabase.from('empresa').upsert({
        id: empresa.id,
        nombre: empresa.nombre,
        sector: empresa.sector,
        num_empleados: empresa.num_empleados,
        ecosistema: empresa.ecosistema,
        herramientas_desuso: empresa.herramientas_desuso
      });

      // Insert / Upsert Resultado
      await supabase.from('resultado').upsert({
        participante_id: resultado.participante_id,
        empresa_id: resultado.empresa_id,
        fuga_tiempo: resultado.fuga_tiempo,
        fuga_procesos: resultado.fuga_procesos,
        fuga_datos: resultado.fuga_datos,
        fuga_cliente: resultado.fuga_cliente,
        agujero_principal: resultado.agujero_principal,
        salud_n1: resultado.salud_n1,
        salud_n2: resultado.salud_n2,
        salud_n3: resultado.salud_n3,
        nivel_debil: resultado.nivel_debil,
        semaforo: resultado.semaforo,
        horas_recuperables: resultado.horas_recuperables,
        hoja_ruta: resultado.hoja_ruta,
        alertas: resultado.alertas
      });
    } catch (e) {
      console.warn('Supabase sync error:', e);
    }
  }

  private seedMockData() {
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

      this.informes.set(emp.id, {
        empresa_id: emp.id,
        resumen_ejecutivo: `La empresa ${emp.nombre} presenta un diagnóstico centrado en su coordinación operativa (Nivel 2). La fuga principal identificada radica en ${res.agujero_principal}, requiriendo sistematización inmediata.`,
        editado_por_facilitador: false
      });
    });
  }
}
