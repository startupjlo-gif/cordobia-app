import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { Empresa, ResultadoDiagnostico, TareaParticipante } from '@/types';

// In-Memory Server Store for live cross-device sync when Supabase is not connected
const globalServerStore = {
  etapaAutorizada: 1,
  empresas: new Map<string, Empresa>(),
  resultados: new Map<string, ResultadoDiagnostico>(),
  tareasParticipante: new Map<string, TareaParticipante[]>(),
};

export async function GET() {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data: dbEmpresas, error: errEmp } = await supabase.from('empresa').select('*');
      const { data: dbResultados, error: errRes } = await supabase.from('resultado').select('*');
      const { data: dbSesiones } = await supabase.from('sesion').select('*').limit(1);

      if (errEmp) console.warn('Supabase get empresas error:', errEmp);
      if (errRes) console.warn('Supabase get resultados error:', errRes);

      const etapa = dbSesiones?.[0]?.etapa_autorizada || globalServerStore.etapaAutorizada;

      const empresasMap: Record<string, Empresa> = {};
      (dbEmpresas || []).forEach((e) => {
        empresasMap[e.id] = e;
      });

      const resultadosList = (dbResultados || []).map((r) => ({
        ...r,
        fugas: {
          Tiempo: r.fuga_tiempo,
          Procesos: r.fuga_procesos,
          Datos: r.fuga_datos,
          Cliente: r.fuga_cliente,
        },
      }));

      return NextResponse.json({
        success: true,
        isSupabase: true,
        etapaAutorizada: etapa,
        empresas: empresasMap,
        resultados: resultadosList,
        tareasParticipante: Array.from(globalServerStore.tareasParticipante.entries()),
      });
    }

    // Fallback to In-Memory Global Server Store
    const empresasMap: Record<string, Empresa> = {};
    globalServerStore.empresas.forEach((val, key) => {
      empresasMap[key] = val;
    });

    return NextResponse.json({
      success: true,
      isSupabase: false,
      etapaAutorizada: globalServerStore.etapaAutorizada,
      empresas: empresasMap,
      resultados: Array.from(globalServerStore.resultados.values()),
      tareasParticipante: Array.from(globalServerStore.tareasParticipante.entries()),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, empresa, resultado, tareas, etapaAutorizada } = body;

    if (action === 'autorizar_etapa') {
      globalServerStore.etapaAutorizada = etapaAutorizada || 1;
      if (isSupabaseConfigured && supabase) {
        await supabase.from('sesion').update({ etapa_autorizada: etapaAutorizada }).eq('codigo', 'CORDOBIA2026');
      }
      return NextResponse.json({ success: true, etapaAutorizada: globalServerStore.etapaAutorizada });
    }

    if (action === 'reset') {
      globalServerStore.empresas.clear();
      globalServerStore.resultados.clear();
      globalServerStore.tareasParticipante.clear();
      globalServerStore.etapaAutorizada = 1;

      if (isSupabaseConfigured && supabase) {
        await supabase.from('resultado').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('participante').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('empresa').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      return NextResponse.json({ success: true, message: 'Store reset completely' });
    }

    if (action === 'save_empresa' && empresa) {
      globalServerStore.empresas.set(empresa.id, empresa);
      if (isSupabaseConfigured && supabase) {
        const { error: errEmp } = await supabase.from('empresa').upsert({
          id: empresa.id,
          nombre: empresa.nombre,
          sector: empresa.sector,
          num_empleados: empresa.num_empleados,
          ecosistema: empresa.ecosistema,
          herramientas_desuso: empresa.herramientas_desuso,
        });
        if (errEmp) {
          console.error('Supabase empresa upsert error:', errEmp);
          return NextResponse.json({ success: false, error: errEmp.message }, { status: 400 });
        }
      }
      return NextResponse.json({ success: true, empresaId: empresa.id });
    }

    if (action === 'save_resultado' && empresa && resultado) {
      globalServerStore.empresas.set(empresa.id, empresa);
      globalServerStore.resultados.set(resultado.participante_id, resultado);

      if (tareas && Array.isArray(tareas)) {
        globalServerStore.tareasParticipante.set(resultado.participante_id, tareas);
      }

      if (isSupabaseConfigured && supabase) {
        // 1. Upsert Empresa
        const { error: errEmp } = await supabase.from('empresa').upsert({
          id: empresa.id,
          nombre: empresa.nombre,
          sector: empresa.sector,
          num_empleados: empresa.num_empleados,
          ecosistema: empresa.ecosistema,
          herramientas_desuso: empresa.herramientas_desuso,
        });
        if (errEmp) {
          console.error('Supabase save empresa error:', errEmp);
          return NextResponse.json({ success: false, error: errEmp.message }, { status: 400 });
        }

        // 2. Upsert Participante (to satisfy Foreign Key constraint)
        const { error: errPart } = await supabase.from('participante').upsert({
          id: resultado.participante_id,
          empresa_id: empresa.id,
          nombre: empresa.nombre,
          estado: 'completado',
          paso_actual: 4,
        });
        if (errPart) {
          console.error('Supabase save participante error:', errPart);
          return NextResponse.json({ success: false, error: errPart.message }, { status: 400 });
        }

        // 3. Upsert Resultado
        const { error: errRes } = await supabase.from('resultado').upsert({
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
          alertas: resultado.alertas,
        });
        if (errRes) {
          console.error('Supabase save resultado error:', errRes);
          return NextResponse.json({ success: false, error: errRes.message }, { status: 400 });
        }
      }

      return NextResponse.json({ success: true, empresaId: empresa.id });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('API store POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
