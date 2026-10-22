const criterios = [
  {
    titulo: '1. Puntualidad y asistencia',
    descripcion: 'Se otorga un bono por asistencia perfecta mensual sin tardanzas ni ausencias injustificadas.',
    calculo: 'L. 500 fijos al mes si no tiene ninguna tardanza ni falta injustificada.',
  },
  {
    titulo: '2. Desempeño laboral sobresaliente',
    descripcion: 'Evaluación trimestral del supervisor directo.',
    calculo: 'De 90–100 pts → L. 1,000 | De 80–89 pts → L. 600 | De 70–79 pts → L. 300.',
  },
  {
    titulo: '3. Años de servicio',
    descripcion: 'Bono por antigüedad en la institución.',
    calculo: 'L. 200 por cada año cumplido de servicio (Ej: 5 años = L. 1,000).',
  },
  {
    titulo: '4. Capacitaciones completadas',
    descripcion: 'Por completar cursos o capacitaciones aprobadas por la clínica.',
    calculo: 'L. 250 por cada capacitación completada y certificada.',
  },
  {
    titulo: '5. Propuestas de mejora aceptadas',
    descripcion: 'Ideas o mejoras presentadas por el empleado que fueron implementadas.',
    calculo: 'L. 400 por propuesta aceptada e implementada.',
  },
  {
    titulo: '6. Atención al paciente',
    descripcion: 'Calificación promedio del paciente en encuestas de satisfacción.',
    calculo: '4.5–5.0 estrellas → L. 800 | 4.0–4.4 → L. 400 | Menos de 4.0 → sin bono.',
  },
  {
    titulo: '7. Trabajo en equipo',
    descripcion: 'Evaluación del compañerismo y colaboración con otros departamentos.',
    calculo: 'Puntuación del equipo ≥ 85% → L. 300 adicionales al bono de desempeño.',
  },
  {
    titulo: '8. Metas departamentales cumplidas',
    descripcion: 'Cuando el departamento cumple o supera sus metas operativas mensuales.',
    calculo: 'L. 600 por empleado del departamento al cumplir el 100% de metas.',
  },
  {
    titulo: '9. Reducción de errores/incidentes',
    descripcion: 'Mes sin errores documentados o incidentes reportados.',
    calculo: 'L. 350 si el empleado no tiene ningún incidente reportado en el mes.',
  },
  {
    titulo: '10. Flexibilidad y disponibilidad',
    descripcion: 'Por disponibilidad para cubrir turnos adicionales cuando la clínica lo requiere.',
    calculo: 'L. 150 por turno extra cubierto por solicitud institucional (máx. 4 por mes).',
  },
]

export default function Incentivos() {
  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-primary-600 mb-4">💰 Criterios de Incentivos Económicos</h2>
      <p className="text-sm text-gray-500 mb-5">
        Los incentivos se calculan mensualmente y se acumulan independientemente entre sí.
      </p>
      <div className="space-y-3">
        {criterios.map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="font-semibold text-gray-800 mb-1">{c.titulo}</p>
            <p className="text-sm text-gray-600 mb-2">{c.descripcion}</p>
            <div className="bg-primary-50 text-primary-700 text-sm rounded-lg px-3 py-2">
              <span className="font-medium">Cálculo: </span>{c.calculo}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
