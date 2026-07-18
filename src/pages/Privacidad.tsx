import React from "react";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import AppLogo from "../components/AppLogo";

export default function Privacidad() {
  const scrollToId = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div id="privacy-policy-es-page" className="min-h-screen bg-[#0A1128] text-[#E8ECF7] font-sans">
      {/* Header Bar */}
      <header id="privacy-es-header" className="bg-[#0F1B3D] text-white py-14 px-6 relative overflow-hidden border-b border-[#263462]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1B3D] to-[#0A1128] opacity-90 z-0"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-8">
            <Link id="privacy-es-back-home" to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-[#3DFFA0] transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Volver al inicio
            </Link>
            
            <AppLogo />
          </div>

          <h1 id="privacy-es-main-title" className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[#FFFFFF]">
            Política de privacidad
          </h1>
          <p className="text-[#9FACD1] text-sm">
            Última actualización: <strong className="text-[#FFFFFF] font-semibold">16 de julio de 2026</strong> · Versión 1.0
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main id="privacy-es-main-content" className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        
        {/* Intro */}
        <div id="privacy-es-intro-card" className="border-l-4 border-[#3DFFA0] pl-6 py-2 mb-6 text-[#9FACD1] text-lg leading-relaxed italic">
          <p>
            SafeCallr es un servicio de autenticación de interlocutores en llamadas telefónicas, diseñado para luchar contra el fraude y la suplantación de identidad. La protección de sus datos personales está en el centro de nuestra misión: esta política explica de forma transparente qué datos recogemos, por qué, durante cuánto tiempo los conservamos y cuáles son sus derechos.
          </p>
        </div>

        {/* Prevalence disclaimer */}
        <div id="privacy-es-prevalence" className="bg-[#131E42] border border-[#263462] rounded-xl p-4 mb-10 text-sm text-[#9FACD1] leading-relaxed">
          Esta versión en español se facilita a título informativo. En caso de discrepancia o de controversia sobre su interpretación, prevalecerá la{" "}
          <Link to="/confidentialite" className="text-[#3DFFA0] hover:underline font-semibold">
            versión francesa
          </Link>{" "}
          .
        </div>

        {/* Table of Contents */}
        <nav id="privacy-es-toc" className="bg-[#131E42] border border-[#263462] rounded-xl p-6 mb-12 shadow-sm">
          <h2 className="text-xs uppercase tracking-widest font-bold text-[#9FACD1] mb-4">
            Índice
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <li>
              <a href="#responsable" onClick={(e) => scrollToId(e, "responsable")} className="text-[#3DFFA0] hover:text-white hover:underline transition-colors block py-0.5">
                1. Responsable del tratamiento
              </a>
            </li>
            <li>
              <a href="#datos" onClick={(e) => scrollToId(e, "datos")} className="text-[#3DFFA0] hover:text-white hover:underline transition-colors block py-0.5">
                2. Datos que recogemos
              </a>
            </li>
            <li>
              <a href="#no-recoge" onClick={(e) => scrollToId(e, "no-recoge")} className="text-[#3DFFA0] hover:text-white hover:underline transition-colors block py-0.5">
                3. Lo que SafeCallr no recoge
              </a>
            </li>
            <li>
              <a href="#finalidades" onClick={(e) => scrollToId(e, "finalidades")} className="text-[#3DFFA0] hover:text-white hover:underline transition-colors block py-0.5">
                4. Finalidades y bases jurídicas
              </a>
            </li>
            <li>
              <a href="#conservacion" onClick={(e) => scrollToId(e, "conservacion")} className="text-[#3DFFA0] hover:text-white hover:underline transition-colors block py-0.5">
                5. Plazos de conservación
              </a>
            </li>
            <li>
              <a href="#destinatarios" onClick={(e) => scrollToId(e, "destinatarios")} className="text-[#3DFFA0] hover:text-white hover:underline transition-colors block py-0.5">
                6. Destinatarios y encargados del tratamiento
              </a>
            </li>
            <li>
              <a href="#transferencias" onClick={(e) => scrollToId(e, "transferencias")} className="text-[#3DFFA0] hover:text-white hover:underline transition-colors block py-0.5">
                7. Transferencias fuera de la Unión Europea
              </a>
            </li>
            <li>
              <a href="#seguridad" onClick={(e) => scrollToId(e, "seguridad")} className="text-[#3DFFA0] hover:text-white hover:underline transition-colors block py-0.5">
                8. Seguridad
              </a>
            </li>
            <li>
              <a href="#derechos" onClick={(e) => scrollToId(e, "derechos")} className="text-[#3DFFA0] hover:text-white hover:underline transition-colors block py-0.5">
                9. Sus derechos
              </a>
            </li>
            <li>
              <a href="#edad" onClick={(e) => scrollToId(e, "edad")} className="text-[#3DFFA0] hover:text-white hover:underline transition-colors block py-0.5">
                10. Edad mínima
              </a>
            </li>
            <li>
              <a href="#cookies" onClick={(e) => scrollToId(e, "cookies")} className="text-[#3DFFA0] hover:text-white hover:underline transition-colors block py-0.5">
                11. Cookies
              </a>
            </li>
            <li>
              <a href="#modificaciones" onClick={(e) => scrollToId(e, "modificaciones")} className="text-[#3DFFA0] hover:text-white hover:underline transition-colors block py-0.5">
                12. Modificaciones de esta política
              </a>
            </li>
            <li>
              <a href="#contacto" onClick={(e) => scrollToId(e, "contacto")} className="text-[#3DFFA0] hover:text-white hover:underline transition-colors block py-0.5">
                13. Contacto
              </a>
            </li>
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-12 leading-relaxed text-base">
          
          <section id="responsable" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#FFFFFF] mb-4">
              1. Responsable del tratamiento
            </h2>
            <div className="space-y-3">
              <p>El responsable del tratamiento de los datos personales recogidos a través de la aplicación y del sitio web SafeCallr es:</p>
              <div className="bg-[#131E42] border border-[#263462] rounded-xl p-4 shadow-sm">
                <strong className="text-[#FFFFFF]">MOTIOON</strong>, sociedad por acciones simplificada unipersonal de derecho francés (SASU)<br />
                Domicilio social: 60 rue François I<sup>er</sup>, 75008 París, Francia<br />
                Inscrita en el Registro Mercantil de París (RCS) con el número 930 280 086<br />
                Representada por su presidente, Rémi Prével
              </div>
              <p>
                Para cualquier cuestión relativa a sus datos personales:{" "}
                <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline font-medium">
                  contact@safecallr.com
                </a>
              </p>
              <p>
                MOTIOON no ha designado un delegado de protección de datos (DPO), ya que dicha designación no es obligatoria dada la naturaleza y la escala actuales de sus tratamientos. El punto de contacto indicado gestiona todas las solicitudes relativas a datos personales.
              </p>
            </div>
          </section>

          <section id="datos" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#FFFFFF] mb-4">
              2. Datos que recogemos
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">2.1 Datos de la cuenta (todos los usuarios)</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-[#FFFFFF]">Identidad:</strong> nombre completo;</li>
                  <li><strong className="text-[#FFFFFF]">Datos de contacto:</strong> dirección de correo electrónico, número de teléfono;</li>
                  <li><strong className="text-[#FFFFFF]">Autenticación:</strong> contraseña (almacenada exclusivamente de forma cifrada/hasheada — nunca tenemos acceso a su contraseña en claro);</li>
                  <li><strong className="text-[#FFFFFF]">Tipo de cuenta:</strong> particular o profesional.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">2.2 Datos de verificación profesional (solo cuentas profesionales)</h3>
                <p>
                  Para garantizar que solo los profesionales legítimos puedan reivindicar un estatus profesional verificado — lo que constituye el fundamento mismo de la protección que ofrece SafeCallr —, solicitamos a los profesionales un justificante de la existencia de su empresa o actividad (extracto Kbis francés o documento equivalente que acredite la existencia legal de la entidad).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">2.3 Datos de uso del servicio</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-[#FFFFFF]">Contactos seguros:</strong> la lista de usuarios de SafeCallr con los que ha establecido una relación de verificación;</li>
                  <li><strong className="text-[#FFFFFF]">Historial de verificaciones:</strong> fecha, interlocutor y resultado (identidad confirmada o no) de cada solicitud de autenticación;</li>
                  <li><strong className="text-[#FFFFFF]">Códigos de verificación:</strong> los códigos de un solo uso generados durante una solicitud de autenticación, que expiran automáticamente en un plazo breve;</li>
                  <li><strong className="text-[#FFFFFF]">Preferencias:</strong> idioma de la aplicación.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">2.4 Datos técnicos</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-[#FFFFFF]">Token de notificaciones push (token FCM):</strong> identificador técnico que permite entregar las notificaciones de autenticación en su dispositivo;</li>
                  <li><strong className="text-[#FFFFFF]">Plataforma utilizada:</strong> iOS, Android o web;</li>
                  <li><strong className="text-[#FFFFFF]">Registros técnicos:</strong> registros de conexión y de errores estrictamente necesarios para el funcionamiento, la seguridad y el mantenimiento del servicio.</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="no-recoge" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#FFFFFF] mb-4">
              3. Lo que SafeCallr no recoge
            </h2>
            <div className="bg-[#3DFFA0]/12 border-l-4 border-l-[#3DFFA0] rounded-xl p-6 shadow-sm">
              <p className="font-semibold text-lg text-[#3DFFA0] mb-3">
                SafeCallr no graba sus llamadas, no recoge ningún dato de voz y no realiza ningún análisis biométrico.
              </p>
              <p className="text-sm text-[#9FACD1] mb-0">
                El servicio funciona exclusivamente mediante el intercambio de códigos de verificación: no tenemos acceso ni al contenido ni al audio de sus conversaciones telefónicas, que se desarrollan fuera de la aplicación. SafeCallr no accede a la agenda de su teléfono sin su autorización y no recoge su ubicación.
              </p>
            </div>
          </section>

          <section id="finalidades" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#FFFFFF] mb-4">
              4. Finalidades y bases jurídicas
            </h2>
            <div className="overflow-x-auto border border-[#263462] rounded-xl shadow-sm bg-[#131E42]">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#182550] text-[#3DFFA0]">
                    <th className="p-4 font-semibold border-b border-[#263462]">Finalidad</th>
                    <th className="p-4 font-semibold border-b border-[#263462]">Datos afectados</th>
                    <th className="p-4 font-semibold border-b border-[#263462]">Base jurídica (art. 6 RGPD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263462] text-[#E8ECF7]">
                  <tr>
                    <td className="p-4 align-top">Creación y gestión de su cuenta, prestación del servicio de autenticación</td>
                    <td className="p-4 align-top">Datos de la cuenta, contactos seguros, códigos de verificación, token FCM</td>
                    <td className="p-4 align-top">Ejecución del contrato</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Verificación del estatus profesional de las cuentas profesionales</td>
                    <td className="p-4 align-top">Justificante de existencia de la empresa (Kbis o equivalente)</td>
                    <td className="p-4 align-top">Ejecución del contrato e interés legítimo (prevención del fraude y de la suplantación de identidad profesional)</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Historial de sus verificaciones, consultable en la aplicación</td>
                    <td className="p-4 align-top">Historial de verificaciones</td>
                    <td className="p-4 align-top">Ejecución del contrato</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Seguridad, prevención de abusos, mantenimiento del servicio</td>
                    <td className="p-4 align-top">Registros técnicos</td>
                    <td className="p-4 align-top">Interés legítimo (seguridad del servicio y de sus usuarios)</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Respuesta a sus solicitudes y soporte</td>
                    <td className="p-4 align-top">Datos de contacto, contenido de sus solicitudes</td>
                    <td className="p-4 align-top">Ejecución del contrato e interés legítimo</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Cumplimiento de nuestras obligaciones legales (facturación de suscripciones, contabilidad)</td>
                    <td className="p-4 align-top">Datos de cuenta y de facturación de las cuentas profesionales</td>
                    <td className="p-4 align-top">Obligación legal</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-[#9FACD1]">
              No utilizamos sus datos con fines de publicidad dirigida y no vendemos sus datos a terceros.
            </p>
          </section>

          <section id="conservacion" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#FFFFFF] mb-4">
              5. Plazos de conservación
            </h2>
            <div className="overflow-x-auto border border-[#263462] rounded-xl shadow-sm bg-[#131E42]">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#182550] text-[#3DFFA0]">
                    <th className="p-4 font-semibold border-b border-[#263462]">Datos</th>
                    <th className="p-4 font-semibold border-b border-[#263462]">Plazo de conservación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263462] text-[#E8ECF7]">
                  <tr>
                    <td className="p-4 align-top">Datos de la cuenta</td>
                    <td className="p-4 align-top">Durante toda la vida de la cuenta; supresión en un plazo de 30 días tras el cierre de la cuenta</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Códigos de verificación</td>
                    <td className="p-4 align-top">Suprimidos automáticamente tras su expiración y, a más tardar, 72 horas después de su generación</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Historial de verificaciones</td>
                    <td className="p-4 align-top">12 meses continuos; después, supresión o anonimización</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Justificante profesional (Kbis o equivalente)</td>
                    <td className="p-4 align-top">Durante toda la vida de la cuenta profesional, para poder acreditar en todo momento la validez del estatus verificado</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Registros técnicos</td>
                    <td className="p-4 align-top">12 meses como máximo</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Datos de facturación (cuentas profesionales)</td>
                    <td className="p-4 align-top">10 años a partir del cierre del ejercicio, conforme a las obligaciones contables legales</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-[#9FACD1]">
              Determinados datos pueden conservarse más allá de estos plazos cuando la ley lo exija o para la constatación, el ejercicio o la defensa de derechos ante los tribunales, durante los plazos de prescripción aplicables.
            </p>
          </section>

          <section id="destinatarios" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#FFFFFF] mb-4">
              6. Destinatarios y encargados del tratamiento
            </h2>
            <p className="mb-4">
              Sus datos son accesibles únicamente para el personal autorizado de MOTIOON y para los proveedores técnicos estrictamente necesarios para el funcionamiento del servicio, que actúan como encargados del tratamiento en el sentido del RGPD:
            </p>
            <div className="overflow-x-auto border border-[#263462] rounded-xl shadow-sm bg-[#131E42] mb-6">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#182550] text-[#3DFFA0]">
                    <th className="p-4 font-semibold border-b border-[#263462]">Proveedor</th>
                    <th className="p-4 font-semibold border-b border-[#263462]">Función</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263462] text-[#E8ECF7]">
                  <tr>
                    <td className="p-4 align-top">Google Ireland Ltd / Google LLC — Firebase</td>
                    <td className="p-4 align-top">Autenticación de cuentas, base de datos, envío de notificaciones push (FCM)</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Vercel Inc.</td>
                    <td className="p-4 align-top">Alojamiento de la aplicación web y de safecallr.com</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">IONOS SE</td>
                    <td className="p-4 align-top">Gestión del nombre de dominio y servicios asociados</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mb-3">
              Cada encargado del tratamiento está vinculado por compromisos contractuales de protección de datos conformes con el artículo 28 del RGPD. Además, en el marco del propio funcionamiento del servicio, determinada información sobre usted (nombre, estatus verificado) is visible para los usuarios con los que establece una relación de verificación — ese es precisamente el objeto del servicio.
            </p>
            <p>
              Sus datos también pueden comunicarse a las autoridades competentes cuando la ley nos obligue a ello.
            </p>
          </section>

          <section id="transferencias" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#FFFFFF] mb-4">
              7. Transferencias fuera de la Comisión Europea (o Unión Europea)
            </h2>
            <p className="mb-3">
              Algunos de nuestros proveedores (Google, Vercel) son empresas estadounidenses o pertenecen a grupos estadounidenses. Por lo tanto, en el marco de sus prestaciones pueden producirse transferencias de datos a Estados Unidos.
            </p>
            <p>
              Estas transferencias están amparadas por los mecanismos previstos en el RGPD: la decisión de adecuación de la Comisión Europea relativa al Marco de Privacidad de Datos UE–EE. UU. (EU–US Data Privacy Framework), al que Google y Vercel están adheridos, y/o las cláusulas contractuales tipo de la Comisión Europea, completadas en su caso con medidas adicionales.
            </p>
          </section>

          <section id="seguridad" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#FFFFFF] mb-4">
              8. Seguridad
            </h2>
            <p className="mb-4">
              Aplicamos medidas técnicas y organizativas alineadas con las buenas prácticas del sector para proteger sus datos, en particular:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>cifrado de los datos en tránsito (TLS);</li>
              <li>almacenamiento de las contraseñas exclusivamente de forma hasheada;</li>
              <li>códigos de verificación de un solo uso con expiración automática;</li>
              <li>reglas de acceso estrictas a las bases de datos, que limitan a cada usuario a sus propios datos;</li>
              <li>principio de minimización: solo recogemos los datos necesarios para el servicio.</li>
            </ul>
            <p>
              No obstante, ningún sistema de información puede considerarse infalible. En caso de violación de datos que pueda suponer un riesgo para sus derechos y libertades, lo notificaremos a la autoridad de control francesa (CNIL) y, cuando el riesgo sea elevado, a las personas afectadas, en las condiciones previstas en los artículos 33 y 34 del RGPD.
            </p>
          </section>

          <section id="derechos" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#FFFFFF] mb-4">
              9. Sus derechos
            </h2>
            <p className="mb-4">
              De conformidad con el RGPD y la legislación francesa de protección de datos, usted dispone de los siguientes derechos sobre sus datos personales:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong className="text-[#FFFFFF]">Derecho de acceso:</strong> obtener una copia de los datos que tenemos sobre usted;</li>
              <li><strong className="text-[#FFFFFF]">Derecho de rectificación:</strong> hacer corregir datos inexacts o incompletos;</li>
              <li><strong className="text-[#FFFFFF]">Derecho de supresión:</strong> solicitar la eliminación de sus datos, en particular mediante la supresión de su cuenta;</li>
              <li><strong className="text-[#FFFFFF]">Derecho a la limitación:</strong> solicitar la suspensión temporal del tratamiento de sus datos;</li>
              <li><strong className="text-[#FFFFFF]">Derecho a la portabilidad:</strong> recibir sus datos en un formato estructurado y de uso común;</li>
              <li><strong className="text-[#FFFFFF]">Derecho de oposición:</strong> oponerse a los tratamientos basados en nuestro interés legítimo, por motivos relacionados con su situación particular;</li>
              <li><strong className="text-[#FFFFFF]">Directives post mortem:</strong> definir directrices sobre el destino de sus datos tras su fallecimiento, conforme al derecho francés.</li>
            </ul>
            <p className="mb-3">
              Para ejercer estos derechos, contáctenos en{" "}
              <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline font-medium">
                contact@safecallr.com
              </a>
              . Podremos solicitarle un justificante de identidad en caso de duda razonable sobre la identidad del solicitante. Respondemos en el plazo de un mes, prorrogable dos meses para las solicitudes complejas.
            </p>
            <p>
              Si considera que sus derechos no se respetan, puede presentar una reclamación ante la autoridad de control francesa, la Commission nationale de l'informatique et des libertés (CNIL):{" "}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#3DFFA0] hover:underline font-medium">
                www.cnil.fr
              </a>{" "}
              — CNIL, 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, Francia — o ante la autoridad de control de su país de residencia.
            </p>
          </section>

          <section id="edad" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#FFFFFF] mb-4">
              10. Edad mínima
            </h2>
            <p>
              SafeCallr está reservado a personas de <strong className="text-[#FFFFFF]">18 años o más</strong>. Al crear una cuenta, usted confirma tener al menos 18 años. Si constatamos que una cuenta ha sido creada por un menor, procederemos a su supresión.
            </p>
          </section>

          <section id="cookies" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#FFFFFF] mb-4">
              11. Cookies
            </h2>
            <p className="mb-3">
              La aplicación y el sitio web SafeCallr utilizan únicamente rastreadores y almacenamiento local estrictamente necesarios para el funcionamiento del servicio (mantenimiento de su sesión, memorización de su idioma). Estos rastreadores estrictamente necesarios están exentos de consentimiento según las directrices aplicables de la CNIL.
            </p>
            <p>
              No utilizamos cookies publicitarias. Si en el futuro se implementaran herramientas de medición de audiencia, esta política se actualizaría y se recabaría su consentimiento cuando la normativa lo exija.
            </p>
          </section>

          <section id="modificaciones" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#FFFFFF] mb-4">
              12. Modificaciones de esta política
            </h2>
            <p>
              MOTIOON puede modificar esta política en cualquier momento, en particular en caso de evolución del servicio, de nuestras prácticas o de la normativa. La versión vigente es la publicada en esta página, cuya fecha de última actualización figura en la parte superior. En caso de modificación sustancial, se lo comunicaremos mediante una notificación en la aplicación o por correo electrónico antes de su entrada en vigor.
            </p>
          </section>

          <section id="contacto" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#FFFFFF] mb-4">
              13. Contacto
            </h2>
            <p className="mb-3">Para cualquier cuestión relativa a esta política o a sus datos personales:</p>
            <div className="bg-[#131E42] border border-[#263462] rounded-xl p-4 shadow-sm">
              <strong className="text-[#FFFFFF]">MOTIOON — SafeCallr</strong><br />
              60 rue François I<sup>er</sup>, 75008 París, Francia<br />
              <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline font-medium">
                contact@safecallr.com
              </a>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer id="privacy-es-footer" className="border-t border-[#263462] py-8 px-6 text-center text-sm text-[#9FACD1] bg-[#0A1128]">
        <div className="max-w-3xl mx-auto">
          © 2026 MOTIOON SASU — SafeCallr. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
