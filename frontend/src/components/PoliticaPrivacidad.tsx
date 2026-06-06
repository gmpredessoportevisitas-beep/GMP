interface PoliticaPrivacidadProps {
  setPrivacyOpen: (open: boolean) => void;
}

import { VERSION_POLITICA } from '../hooks/useTecnicoView';

export default function PoliticaPrivacidad({setPrivacyOpen}: PoliticaPrivacidadProps) {
  return(
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto"
          onClick={() => setPrivacyOpen(false)}>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 animate-fade-in"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setPrivacyOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800">Politica de Tratamiento de Datos Personales</h2>
                <p className="text-xs text-gray-500 mt-1">Ley 1581 de 2012 — Republica de Colombia</p>
              </div>

              <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
                <section>
                  <h3 className="text-base font-bold text-primary-700 mb-2">1. Identificacion del Responsable del Tratamiento</h3>
                  <p className="mb-1"><strong>Razon Social:</strong>GMP REDES</p>
                  <p className="mb-1"><strong>NIT:</strong> [NIT]</p>
                  <p className="mb-1"><strong>Direccion:</strong> [DIRECCION]</p>
                  <p className="mb-1"><strong>Correo Electronico:</strong> [CORREO_CONTACTO]</p>
                  <p className="mb-1"><strong>Telefono:</strong> [TELEFONO]</p>
                </section>

                <section>
                  <h3 className="text-base font-bold text-primary-700 mb-2">2. Finalidad del Tratamiento de Datos</h3>
                  <p>Los datos personales recolectados seran utilizados exclusivamente para las siguientes finalidades:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Registro y documentacion de visitas tecnicas de mantenimiento preventivo.</li>
                    <li>Evaluacion de la calidad del servicio prestado por los tecnicos.</li>
                    <li>Constancia de trabajo realizado en las instalaciones del cliente.</li>
                    <li>Fines estadisticos internos para la mejora continua del servicio.</li>
                    <li>Cumplimiento de obligaciones contractuales entre las partes.</li>
                  </ul>
                  <p className="mt-2">El tratamiento de los datos se limita a lo estrictamente necesario para la prestacion del servicio de mantenimiento preventivo y no seran utilizados para fines comerciales, publicitarios o de prospeccion sin autorizacion expresa adicional del titular.</p>
                </section>

                <section>
                  <h3 className="text-base font-bold text-primary-700 mb-2">3. Derechos del Titular de los Datos</h3>
                  <p>De conformidad con el articulo 8 de la Ley 1581 de 2012, el titular de los datos personales tiene los siguientes derechos:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Conocer, actualizar y rectificar sus datos personales.</li>
                    <li>Solicitar prueba de la autorizacion otorgada para el tratamiento.</li>
                    <li>Ser informado sobre el uso que se ha dado a sus datos.</li>
                    <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
                    <li>Revocar la autorizacion y/o solicitar la supresion de sus datos.</li>
                    <li>Acceder en forma gratuita a sus datos personales.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-base font-bold text-primary-700 mb-2">4. Procedimiento para Consultas y Reclamos</h3>
                  <p>El titular podra ejercer sus derechos enviando una comunicacion escrita al correo electronico <strong>[CORREO_CONTACTO]</strong>, indicando su nombre completo, documento de identidad y la descripcion clara de su solicitud.</p>
                  <p className="mt-1">Los plazos de respuesta seran:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><strong>Consultas:</strong> maximo diez (10) dias habiles contados a partir de la fecha de recibido.</li>
                    <li><strong>Reclamos:</strong> maximo quince (15) dias habiles contados a partir de la fecha de recibido.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-base font-bold text-primary-700 mb-2">5. Vigencia de la Politica</h3>
                  <p>La presente politica de tratamiento de datos personales rige a partir de la fecha de su aceptacion y tendra una vigencia igual al termino de la relacion comercial entre las partes, y por un periodo adicional de hasta cinco (5) años posteriores a la finalizacion del servicio, conforme a lo establecido en la legislacion colombiana aplicable.</p>
                  <p className="mt-1">Cualquier modificacion sustancial a esta politica sera comunicada oportunamente al titular a traves del correo electronico registrado o mediante publicacion en nuestros canales oficiales.</p>
                </section>

                <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
                  <p>Version {VERSION_POLITICA} — Ultima actualizacion: 05/06/2026</p>
                  <p className="mt-1">Ley 1581 de 2012 — Decreto Reglamentario 1377 de 2013</p>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button type="button" onClick={() => setPrivacyOpen(false)}
                  className="py-2.5 px-8 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all active:scale-[0.97] shadow-md">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
  )
}