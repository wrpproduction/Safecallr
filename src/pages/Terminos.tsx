import React from "react";
import { ArrowLeft, Globe, FileText, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import AppLogo from "../components/AppLogo";

export default function Terminos() {
  const scrollToId = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div id="terminos-page" className="min-h-screen bg-[#0A1128] text-[#E8ECF7] font-sans">
      {/* Header Bar */}
      <header id="terminos-header" className="bg-[#0F1B3D] text-white py-14 px-6 relative overflow-hidden border-b border-[#263462]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1B3D] to-[#0A1128] opacity-90 z-0"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <Link id="terminos-back-home" to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-[#3DFFA0] transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Volver al inicio
            </Link>
            
            {/* Language Switcher Pills */}
            <div className="flex items-center gap-2 bg-[#131E42] border border-[#263462] px-3 py-1.5 rounded-full text-xs font-bold text-[#9FACD1]">
              <Globe size={14} className="text-[#3DFFA0]" />
              <Link to="/cgu" className="hover:text-[#3DFFA0] transition-colors">FR</Link>
              <span className="text-[#263462]">|</span>
              <Link to="/terms" className="hover:text-[#3DFFA0] transition-colors">EN</Link>
              <span className="text-[#263462]">|</span>
              <span className="text-[#3DFFA0]">ES</span>
            </div>

            <AppLogo />
          </div>

          <h1 id="terminos-main-title" className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[#FFFFFF]">
            Condiciones Generales de Uso
          </h1>
          <p className="text-[#9FACD1] text-sm">
            Versión 1.0 — <strong className="text-[#3DFFA0] font-semibold">Julio de 2026</strong>
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main id="terminos-main-content" className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        
        {/* Prevalence disclaimer */}
        <div id="terminos-prevalence" className="bg-[#131E42] border border-[#263462] rounded-xl p-4 mb-10 text-sm text-[#9FACD1] leading-relaxed italic">
          Traducción facilitada a título informativo. En caso de divergencia, prevalecerá la{" "}
          <Link to="/cgu" className="text-[#3DFFA0] hover:underline font-semibold">
            versión francesa
          </Link>
          .
        </div>

        {/* Table of Contents */}
        <nav id="terminos-toc" className="bg-[#131E42] border border-[#263462] rounded-xl p-6 mb-12 shadow-sm">
          <h2 className="text-xs uppercase tracking-widest font-bold text-[#3DFFA0] mb-4 flex items-center gap-2">
            <FileText size={16} /> Sumario
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs md:text-sm">
            <li><a href="#art1" onClick={(e) => scrollToId(e, "art1")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 1 — Editor del servicio</a></li>
            <li><a href="#art2" onClick={(e) => scrollToId(e, "art2")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 2 — Objeto</a></li>
            <li><a href="#art3" onClick={(e) => scrollToId(e, "art3")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 3 — Definiciones</a></li>
            <li><a href="#art4" onClick={(e) => scrollToId(e, "art4")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 4 — Descripción del Servicio</a></li>
            <li><a href="#art5" onClick={(e) => scrollToId(e, "art5")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 5 — Aceptación y modificación</a></li>
            <li><a href="#art6" onClick={(e) => scrollToId(e, "art6")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 6 — Inscripción y cuenta</a></li>
            <li><a href="#art7" onClick={(e) => scrollToId(e, "art7")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 7 — Verificación Usuario Profesional</a></li>
            <li><a href="#art8" onClick={(e) => scrollToId(e, "art8")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 8 — Obligaciones y usos prohibidos</a></li>
            <li><a href="#art9" onClick={(e) => scrollToId(e, "art9")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 9 — Condiciones económicas</a></li>
            <li><a href="#art10" onClick={(e) => scrollToId(e, "art10")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 10 — Disponibilidad del Servicio</a></li>
            <li><a href="#art11" onClick={(e) => scrollToId(e, "art11")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 11 — Responsabilidad</a></li>
            <li><a href="#art12" onClick={(e) => scrollToId(e, "art12")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 12 — Propiedad intelectual</a></li>
            <li><a href="#art13" onClick={(e) => scrollToId(e, "art13")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 13 — Datos personales</a></li>
            <li><a href="#art14" onClick={(e) => scrollToId(e, "art14")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 14 — Duración y resolución</a></li>
            <li><a href="#art15" onClick={(e) => scrollToId(e, "art15")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 15 — Mediación y litigios</a></li>
            <li><a href="#art16" onClick={(e) => scrollToId(e, "art16")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Artículo 16 — Disposiciones generales</a></li>
          </ol>
        </nav>

        {/* Article 1 */}
        <section id="art1" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 1 — Editor del servicio
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            El servicio SafeCallr (el «Servicio»), accesible en <a href="https://safecallr.com" target="_blank" rel="noopener noreferrer" className="text-[#3DFFA0] hover:underline">https://safecallr.com</a> y a través de las aplicaciones móviles SafeCallr disponibles en el App Store y Google Play, es editado por:
          </p>
          <div className="bg-[#131E42] border border-[#263462] rounded-xl p-5 mb-4 shadow-sm">
            <p className="text-[#E8ECF7] leading-relaxed">
              <strong className="text-white">Motioon</strong>, sociedad por acciones simplificada unipersonal (SASU) de derecho francés con un capital de 1.000 euros, inscrita en el Registro Mercantil francés con el número SIRET 930 280 086 00015, con domicilio social en 60 rue François Ier, 75008 París, Francia («Motioon» o el «Editor»).<br />
              Director de la publicación: D. Rémi Prével, Presidente.<br />
              Contacto: <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline font-medium">contact@safecallr.com</a>
            </p>
          </div>
        </section>

        {/* Article 2 */}
        <section id="art2" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 2 — Objeto
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Las presentes Condiciones Generales de Uso (las «CGU») tienen por objeto definir las condiciones en las que los usuarios (los «Usuarios») acceden al Servicio y lo utilizan.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Toda inscripción en el Servicio y todo uso del mismo implican la aceptación plena y sin reservas de las presentes CGU. El Usuario que no acepte las CGU deberá abstenerse de utilizar el Servicio.
          </p>
        </section>

        {/* Article 3 */}
        <section id="art3" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 3 — Definiciones
          </h2>
          <ul className="list-disc list-inside space-y-3 text-[#9FACD1] leading-relaxed text-justify">
            <li><strong className="text-white">«Servicio»:</strong> la plataforma SafeCallr de verificación de identidad telefónica, en sus versiones web y móvil.</li>
            <li><strong className="text-white">«Usuario Particular»:</strong> toda persona física que utilice el Servicio con fines personales y no profesionales.</li>
            <li><strong className="text-white">«Usuario Profesional»:</strong> toda persona física o jurídica que utilice el Servicio en el marco de su actividad profesional, tras la verificación de su condición conforme al artículo 7.</li>
            <li><strong className="text-white">«Organización»:</strong> toda persona jurídica que disponga de un espacio SafeCallr Business que permita la verificación entre colaboradores.</li>
            <li><strong className="text-white">«Código de Verificación»:</strong> código numérico de un solo uso y validez limitada, generado por el Servicio en el marco de una Solicitud de Verificación.</li>
            <li><strong className="text-white">«Solicitud de Verificación»:</strong> solicitud dirigida por un Usuario a otro Usuario con el fin de confirmar la identidad de quien llama durante una llamada telefónica o una videollamada.</li>
          </ul>
        </section>

        {/* Article 4 */}
        <section id="art4" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 4 — Descripción del Servicio
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            SafeCallr es una herramienta de ayuda a la verificación de la identidad de un interlocutor durante una llamada telefónica o una videollamada. Su funcionamiento es el siguiente: quien llama activa desde su interfaz una Solicitud de Verificación; el destinatario recibe una notificación en su aplicación; se genera un Código de Verificación de un solo uso; quien llama comunica dicho código oralmente al destinatario, quien lo introduce en su aplicación para confirmar la concordancia.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            El Código de Verificación nunca se transmite al destinatario por notificación, SMS ni ningún otro canal escrito: su comunicación oral por quien llama constituye el núcleo del mecanismo de verificación.
          </p>
          <p className="text-[#9FACD1] mb-2 leading-relaxed font-semibold text-white">El Servicio comprende tres módulos:</p>
          <ul className="list-disc list-inside space-y-2 text-[#9FACD1] mb-4 leading-relaxed text-justify pl-2">
            <li><strong className="text-white">SafeCallr P2P:</strong> verificación mutua entre particulares, ofrecida de forma gratuita;</li>
            <li><strong className="text-white">SafeCallr Pro:</strong> verificación de la identidad de un profesional ante sus clientes, ofrecida mediante suscripción;</li>
            <li><strong className="text-white">SafeCallr Business:</strong> verificación interna entre colaboradores de una misma Organización.</li>
          </ul>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            El Servicio no recoge ni trata ningún dato biométrico: no se utiliza reconocimiento de voz ni facial. La verificación se basa exclusivamente en códigos efímeros de un solo uso.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            El Servicio se presta como primera versión (producto mínimo viable). El Editor no reivindica en esta fase ninguna certificación de seguridad y no presenta el Servicio como un dispositivo certificado.
          </p>
        </section>

        {/* Article 5 */}
        <section id="art5" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 5 — Aceptación y modificación de las CGU
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            La aceptación de las CGU se produce al crear la cuenta, mediante una casilla que remite a las presentes. Las CGU aplicables son las vigentes en la fecha de uso del Servicio.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            El Editor se reserva la facultad de modificar las CGU en cualquier momento y a su entera discreción, en particular para reflejar la evolución del Servicio, de su oferta o de la normativa. Los Usuarios serán informados de toda modificación sustancial por cualquier medio apropiado (notificación en la aplicación o correo electrónico) con un preaviso razonable. La continuación del uso del Servicio tras la entrada en vigor de las CGU modificadas implicará su aceptación.
          </p>
        </section>

        {/* Article 6 */}
        <section id="art6" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 6 — Inscripción y cuenta
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            La inscripción está reservada a personas físicas mayores de edad con capacidad jurídica.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            El Usuario se compromete a facilitar información exacta, completa y actualizada al inscribirse, y a mantenerla actualizada durante todo el uso del Servicio. Está prohibida la creación de una cuenta con una identidad falsa o por cuenta de un tercero sin autorización.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Las credenciales de acceso son estrictamente personales y confidenciales. El Usuario es responsable de preservar su confidencialidad y de toda actividad realizada desde su cuenta. Se compromete a informar sin demora al Editor de cualquier uso no autorizado de su cuenta.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            El uso del Servicio requiere un dispositivo compatible, conexión a Internet y la activación de las notificaciones de la aplicación. Los costes de conexión y de equipamiento corren a cargo del Usuario.
          </p>
        </section>

        {/* Article 7 */}
        <section id="art7" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 7 — Verificación de la condición de Usuario Profesional
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            El acceso a las funcionalidades SafeCallr Pro está supeditado a la verificación previa de la condición profesional del solicitante por parte del Editor, sobre la base de justificantes (en particular, certificados de inscripción registral y justificantes de inscripción en colegios, cámaras profesionales o registros regulados). El Editor se reserva el derecho de denegar o retirar la condición de Usuario Profesional a todo solicitante que no supere dichas verificaciones o cuyos justificantes resulten inexactos.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            La verificación de la condición profesional no constituye aval ni garantía de la probidad del Usuario Profesional en cuestión, ni garantía de la calidad de las prestaciones que este ofrezca a sus clientes.
          </p>
        </section>

        {/* Article 8 */}
        <section id="art8" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 8 — Obligaciones de los Usuarios y usos prohibidos
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            El Usuario se compromete a utilizar el Servicio conforme a su finalidad, a las presentes CGU y a la normativa vigente. Quedan prohibidos, entre otros:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#9FACD1] mb-4 leading-relaxed text-justify pl-2">
            <li>todo uso del Servicio con fines de usurpación de identidad, fraude, prospección abusiva o acoso;</li>
            <li>la comunicación de un Código de Verificación por un canal escrito (SMS, mensajería, correo electrónico) o su divulgación a terceros;</li>
            <li>todo intento de eludir, alterar o someter a pruebas de intrusión las medidas de seguridad del Servicio sin autorización previa y por escrito del Editor;</li>
            <li>toda extracción, reproducción o uso automatizado de los datos del Servicio (scraping), así como toda sobrecarga voluntaria de la infraestructura;</li>
            <li>la reventa, la sublicencia o la puesta a disposición del Servicio a terceros fuera de los casos expresamente previstos;</li>
            <li>el uso del Servicio para transmitir contenidos ilícitos, difamatorios o que vulneren derechos de terceros.</li>
          </ul>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Todo incumplimiento de estas obligaciones podrá conllevar la suspensión o la resolución de la cuenta en las condiciones del artículo 14, sin perjuicio de cualquier acción que el Editor pudiera emprender.
          </p>
        </section>

        {/* Article 9 */}
        <section id="art9" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 9 — Condiciones económicas
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            El módulo SafeCallr P2P se ofrece de forma gratuita a los Usuarios Particulares. El Editor se reserva el derecho de hacer evolucionar su oferta, previa información a los Usuarios.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Los módulos SafeCallr Pro y SafeCallr Business se ofrecen mediante suscripción, según las tarifas y modalidades comunicadas antes de la contratación. Las condiciones particulares aplicables a las suscripciones profesionales (duración, facturación, renovación, resolución) se precisan en el momento de la contratación y, en su caso, en condiciones generales de venta separadas.
          </p>
        </section>

        {/* Article 10 */}
        <section id="art10" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 10 — Disponibilidad y evolución del Servicio
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            El Editor se esfuerza por garantizar la accesibilidad del Servicio 24 horas al día, 7 días a la semana. No obstante, está sujeto a una obligación de medios: el acceso al Servicio puede verse interrumpido, suspendido o limitado, en particular por operaciones de mantenimiento, actualizaciones, averías, casos de fuerza mayor o hechos de terceros (operadores, proveedores de alojamiento, proveedores de servicios de notificación).
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            La entrega de las notificaciones depende además de factores ajenos al Editor: configuración del dispositivo del Usuario, permisos concedidos a la aplicación, conectividad y servicios de notificación de los sistemas operativos. El Editor no garantiza la recepción de cada notificación en todas las circunstancias.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Dado que el Servicio se encuentra en desarrollo activo, el Editor puede hacer evolucionar, sustituir o suprimir funcionalidades. Las evoluciones sustanciales que afecten a los servicios de pago serán objeto de información previa.
          </p>
        </section>

        {/* Article 11 */}
        <section id="art11" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 11 — Responsabilidad
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            SafeCallr es una herramienta de ayuda a la decisión. El Servicio permite verificar que un interlocutor tiene acceso, en tiempo real, a una cuenta SafeCallr determinada y, en el caso de los Usuarios Profesionales, que dicha cuenta ha sido objeto de la verificación de condición descrita en el artículo 7. El Servicio no garantiza, en cambio, la ausencia de todo fraude, la probidad del interlocutor ni la veracidad de las afirmaciones realizadas durante la conversación.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            La decisión de dar curso a una conversación, comunicar información o efectuar una operación (en particular un pago o una transferencia) es responsabilidad exclusiva del Usuario. El Editor recomienda no comunicar nunca datos bancarios, contraseñas ni códigos de seguridad durante una llamada, aunque esté verificada.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            El Editor no será responsable, en particular: en caso de uso del Servicio contrario a las CGU; en caso de divulgación de un Código de Verificación por un Usuario; en caso de compromiso del dispositivo o de las credenciales del Usuario; por los contenidos y afirmaciones intercambiados entre Usuarios; ni por daños indirectos tales como pérdida de oportunidad, pérdida de datos o perjuicio comercial.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Respecto de los Usuarios Profesionales, y en la medida permitida por la ley, la responsabilidad total del Editor, por cualquier causa, queda limitada al importe de las cantidades efectivamente abonadas por el Usuario Profesional durante los doce meses anteriores al hecho generador.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Ninguna estipulación de las presentes tiene por objeto excluir o limitar la responsabilidad del Editor en caso de dolo, culpa grave, daño corporal o en cualquier otro supuesto en que tal exclusión esté prohibida por la ley. Respecto de los consumidores, las limitaciones previstas en el presente artículo solo se aplican en la medida permitida por el Código de Consumo francés.
          </p>
        </section>

        {/* Article 12 */}
        <section id="art12" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 12 — Propiedad intelectual
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            El Servicio, su estructura, sus interfaces, sus programas, su identidad gráfica, sus textos, el nombre «SafeCallr» y los logotipos asociados están protegidos por el derecho de propiedad intelectual y son propiedad exclusiva de Motioon o de sus licenciantes. Asimismo, se ha depositado un sobre e-Soleau ante el INPI francés como prueba de anterioridad.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            La inscripción en el Servicio confiere al Usuario un derecho de uso personal, no exclusivo, no cedible y no transferible del Servicio, durante el período de su inscripción y conforme a su finalidad. Queda prohibida toda reproducción, representación, adaptación o explotación no autorizada expresamente.
          </p>
        </section>

        {/* Article 13 */}
        <section id="art13" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 13 — Datos personales
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Los tratamientos de datos personales realizados en el marco del Servicio se describen en la{" "}
            <Link to="/privacidad" className="text-[#3DFFA0] hover:underline font-semibold">
              Política de privacidad
            </Link>
            , accesible en <a href="https://safecallr.com/confidentialite" className="text-[#3DFFA0] hover:underline">https://safecallr.com/confidentialite</a>, que forma parte integrante del marco contractual. Se invita al Usuario a leerla antes de inscribirse.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Para cualquier consulta o para ejercer sus derechos, el Usuario puede dirigirse a: <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline font-medium">contact@safecallr.com</a>.
          </p>
        </section>

        {/* Article 14 */}
        <section id="art14" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 14 — Duración, suspensión y resolución
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Las CGU se aplican durante todo el período de uso del Servicio.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            El Usuario puede dejar de utilizar el Servicio y solicitar la supresión de su cuenta en cualquier momento, desde la aplicación o escribiendo a <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline font-medium">contact@safecallr.com</a>. La supresión de la cuenta conlleva la desactivación de las funcionalidades de verificación asociadas a la misma.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            El Editor puede suspender, con efecto inmediato, el acceso de un Usuario al Servicio en caso de incumplimiento grave o reiterado de las presentes CGU, sospecha fundada de fraude o usurpación, atentado contra la seguridad del Servicio o requerimiento de una autoridad competente. Salvo urgencia o imposibilidad, el Usuario será informado de los motivos y podrá presentar sus observaciones. La cuenta podrá resolverse si el incumplimiento no se subsana o si hace imposible el mantenimiento de la relación contractual.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            El Editor puede asimismo dejar de prestar la totalidad o parte del Servicio, con un preaviso razonable notificado a los Usuarios y, en el caso de los servicios de pago, con el reembolso a prorrata de las cantidades abonadas por el período no ejecutado.
          </p>
        </section>

        {/* Article 15 */}
        <section id="art15" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 15 — Mediación y litigios de consumo
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            De conformidad con los artículos L. 612-1 y siguientes del Código de Consumo francés, el Usuario consumidor puede recurrir gratuitamente a un mediador de consumo para la resolución amistosa de cualquier litigio con el Editor. El mediador designado es:
          </p>
          <div className="bg-[#131E42] border border-[#263462] rounded-xl p-5 mb-4 shadow-sm">
            <p className="text-[#E8ECF7] leading-relaxed">
              <strong className="text-white">CM2C — Centre de la Médiation de la Consommation de Conciliateurs de justice</strong><br />
              49 rue de Ponthieu, 75008 París, Francia<br />
              Sitio web: <a href="https://www.cm2c.net" target="_blank" rel="noopener noreferrer" className="text-[#3DFFA0] hover:underline inline-flex items-center gap-1">www.cm2c.net <ExternalLink size={12} /></a><br />
              <span className="text-xs text-[#9FACD1] italic">(la adhesión del Editor se encuentra en curso)</span>
            </p>
          </div>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            El Usuario puede asimismo recurrir a la plataforma europea de resolución de litigios en línea:{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#3DFFA0] hover:underline inline-flex items-center gap-1">
              https://ec.europa.eu/consumers/odr <ExternalLink size={12} />
            </a>.
          </p>
        </section>

        {/* Article 16 */}
        <section id="art16" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Artículo 16 — Disposiciones generales
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Si alguna de las estipulaciones de las CGU fuera declarada nula o inaplicable, las demás conservarán su plena validez. El hecho de que el Editor no invoque un incumplimiento no supone renuncia a invocarlo posteriormente.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Las CGU están redactadas en francés y pueden traducirse a otros idiomas a título informativo. En caso de divergencia, prevalecerá la versión francesa.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Las CGU se rigen por el derecho francés. Todo litigio relativo a su interpretación o ejecución será competencia, a falta de resolución amistosa, de los tribunales franceses competentes. Respecto de los Usuarios Profesionales, se atribuye competencia exclusiva al Tribunal de Comercio de París (Tribunal de commerce de Paris), aun en caso de pluralidad de demandados o de llamada en garantía.
          </p>
        </section>

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-[#263462] flex flex-wrap justify-between items-center gap-4 text-xs font-bold uppercase tracking-wider text-[#9FACD1]">
          <Link to="/privacidad" className="hover:text-[#3DFFA0] transition-colors">Política de Privacidad</Link>
          <Link to="/aviso-legal" className="hover:text-[#3DFFA0] transition-colors">Aviso Legal</Link>
        </div>
      </main>
    </div>
  );
}
