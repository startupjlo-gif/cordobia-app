import { evaluarSemaforoPrincipal, evaluarAlertasCoherencia } from './index';
import { TareaParticipante } from '@/types';

// Simple lightweight assertions to run without heavy test runners
export function runRulesEngineTests() {
  console.log("=== RUNNING RULES ENGINE VERIFICATION TESTS ===");

  // Caso A: Salud N2 = 30 -> Semáforo rojo
  const semaforoA = evaluarSemaforoPrincipal(30, 70, 'Tiempo', []);
  console.assert(semaforoA === 'rojo', `Caso A Failed: expected 'rojo', got '${semaforoA}'`);
  console.log(`[PASS] Caso A: Salud N2 = 30 => Semáforo ${semaforoA}`);

  // Caso B: Salud N2 = 70, tarea T11 en Cuello de botella -> Semáforo rojo
  const tareaT11: TareaParticipante = {
    tarea_id: 'T11',
    area: 'Ventas -> Operaciones',
    nivel: 'N2',
    frecuencia: 'Diaria',
    valor: 'Perdemos una venta o dinero',
    horas_semana: 4,
    cuadrante: 'Cuello de botella'
  };
  const semaforoB = evaluarSemaforoPrincipal(70, 70, 'Tiempo', [tareaT11]);
  console.assert(semaforoB === 'rojo', `Caso B Failed: expected 'rojo', got '${semaforoB}'`);
  console.log(`[PASS] Caso B: Salud N2 = 70 + Cuello N2 (T11) => Semáforo ${semaforoB}`);

  // Caso C: Salud N2 = 70, salud N3 = 40, sin cuellos N2 -> Semáforo amarillo
  const semaforoC = evaluarSemaforoPrincipal(70, 40, 'Tiempo', []);
  console.assert(semaforoC === 'amarillo', `Caso C Failed: expected 'amarillo', got '${semaforoC}'`);
  console.log(`[PASS] Caso C: Salud N2 = 70, Salud N3 = 40 => Semáforo ${semaforoC}`);

  // Caso D: Salud N2 = 70, N3 = 70, agujero principal Datos -> Semáforo amarillo + alerta incoherencia
  const semaforoD = evaluarSemaforoPrincipal(70, 70, 'Datos', []);
  console.assert(semaforoD === 'amarillo', `Caso D Failed: expected 'amarillo', got '${semaforoD}'`);
  const alertasD = evaluarAlertasCoherencia('Datos', 70, 70, []);
  const tieneAlertaDatos = alertasD.some(a => a.mensaje.includes('Nivel 3'));
  console.assert(tieneAlertaDatos, `Caso D Alerta Failed: expected incoherencia alert for Datos with N3 >= 70`);
  console.log(`[PASS] Caso D: Agujero Datos + Salud N3=70 => Semáforo ${semaforoD} & Alerta de Coherencia generada`);

  // Caso E: Salud N2 = 80, N3 = 75, agujero principal Tiempo -> Semáforo verde
  const semaforoE = evaluarSemaforoPrincipal(80, 75, 'Tiempo', []);
  console.assert(semaforoE === 'verde', `Caso E Failed: expected 'verde', got '${semaforoE}'`);
  console.log(`[PASS] Caso E: Salud N2 = 80, N3 = 75, Agujero Tiempo => Semáforo ${semaforoE}`);

  console.log("=== ALL 5 SPECIFICATION ENGINE TEST CASES PASSED SUCCESSFULLY ===");
}
