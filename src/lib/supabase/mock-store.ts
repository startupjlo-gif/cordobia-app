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
  private listenersData: Set<() => void> = new Set();

  private constructor() {
    this.initStore();
  }

  private initStore() {
    if (typeof window !== 'undefined' && localStorage.getItem('cordobia_store_cleared_v1') === 'true') {
      this.loadFromLocalStorage();
      return;
    }
    const hasData = this.loadFromLocalStorage();
    if (!hasData) {
      this.seedMockData();
    }
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

  public onDataChanged(callback: () => void) {
    this.listenersData.add(callback);
    return () => this.listenersData.delete(callback);
  }

  public notifyDataChanged() {
    this.listenersData.forEach((fn) => fn());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cordobia_data_updated'));
    }
  }

  public async clearSupabaseData() {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('resultado').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('empresa').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.warn('Supabase clear error:', e);
    }
  }

  public resetStore(keepDemo: boolean = false) {
    this.empresas.clear();
    this.participantes.clear();
    this.mensajes.clear();
    this.resultados.clear();
    this.informes.clear();
    this.tareasParticipante.clear();
    this.sesion.etapa_autorizada = 1;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('cordobia_store_v1');
      if (!keepDemo) {
        localStorage.setItem('cordobia_store_cleared_v1', 'true');
      } else {
        localStorage.removeItem('cordobia_store_cleared_v1');
      }
    }

    if (keepDemo) {
      this.seedMockData();
      this.saveToLocalStorage();
    }
    this.notifyDataChanged();
  }

  public saveToLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      if (this.empresas.size > 0) {
        localStorage.removeItem('cordobia_store_cleared_v1');
      }
      const payload = {
        sesion: this.sesion,
        empresas: Array.from(this.empresas.entries()),
        participantes: Array.from(this.participantes.entries()),
        resultados: Array.from(this.resultados.entries()),
        informes: Array.from(this.informes.entries()),
        tareasParticipante: Array.from(this.tareasParticipante.entries()),
      };
      localStorage.setItem('cordobia_store_v1', JSON.stringify(payload));
      this.notifyDataChanged();
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  private loadFromLocalStorage(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem('cordobia_store_v1');
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.sesion) this.sesion = data.sesion;
      if (Array.isArray(data.empresas)) this.empresas = new Map(data.empresas);
      if (Array.isArray(data.participantes)) this.participantes = new Map(data.participantes);
      if (Array.isArray(data.resultados)) this.resultados = new Map(data.resultados);
      if (Array.isArray(data.informes)) this.informes = new Map(data.informes);
      if (Array.isArray(data.tareasParticipante)) this.tareasParticipante = new Map(data.tareasParticipante);
      return this.empresas.size > 0;
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
      return false;
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

      // Insert / Upsert Participante (FK requirement)
      const isCompletado = resultado.etapa_completada === 3;
      await supabase.from('participante').upsert({
        id: resultado.participante_id,
        empresa_id: empresa.id,
        nombre: empresa.nombre,
        estado: isCompletado ? 'completado' : 'en_progreso',
        paso_actual: isCompletado ? 4 : (resultado.etapa_completada === 2 ? 3 : 2),
      });

      // Insert / Upsert Resultado
      await supabase.from('resultado').upsert({
        id: resultado.participante_id,
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
    // Initial state is 100% clean. Data enters only via real participants.
  }
}
