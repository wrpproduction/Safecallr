import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import AppLogo from "../components/AppLogo";

export default function AvisoLegal() {
  return (
    <div id="aviso-legal-page" className="min-h-screen bg-[#0A1128] text-[#E8ECF7] font-sans">
      {/* Header Bar */}
      <header id="aviso-legal-header" className="bg-[#0F1B3D] text-white py-14 px-6 relative overflow-hidden border-b border-[#263462]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1B3D] to-[#0A1128] opacity-90 z-0"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-8">
            <Link id="aviso-legal-back-home" to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-[#3DFFA0] transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Volver al inicio
            </Link>
            
            <AppLogo />
          </div>

          <h1 id="aviso-legal-main-title" className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[#FFFFFF]">
            Aviso legal
          </h1>
          <p className="text-[#9FACD1] text-sm">
            Última actualización: <strong className="text-[#3DFFA0] font-semibold">18 de julio de 2026</strong>
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main id="aviso-legal-main-content" className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        
        {/* Prevalence disclaimer */}
        <div id="aviso-legal-prevalence" className="bg-[#131E42] border border-[#263462] rounded-xl p-4 mb-10 text-sm text-[#9FACD1] leading-relaxed">
          Esta versión en español se facilita a título informativo. En caso de discrepancia, prevalecerá la{" "}
          <Link to="/mentions-legales" className="text-[#3DFFA0] hover:underline font-semibold">
            versión francesa
          </Link>{" "}
          .
        </div>

        {/* Section 1 */}
        <section id="editor" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            1. Editor del sitio
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed">
            El sitio web safecallr.com y la aplicación SafeCallr son editados por:
          </p>
          <div className="bg-[#131E42] border border-[#263462] rounded-xl p-5 mb-4 shadow-sm">
            <p className="text-[#E8ECF7] leading-relaxed">
              <strong className="text-white">MOTIOON</strong>, sociedad por acciones simplificada unipersonal de derecho francés (SASU) con un capital social de <strong className="text-white">[CAPITAL SOCIAL] €</strong><br />
              Domicilio social: 60 rue François I<sup>er</sup>, 75008 París, Francia<br />
              Inscrita en el Registro Mercantil de París (RCS) con el número 930 280 086<br />
              N.º de IVA intracomunitario: FR17 930 280 086<br />
              Correo electrónico: <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline">contact@safecallr.com</a>
            </p>
          </div>
          <p className="text-[#9FACD1] leading-relaxed">
            <strong className="text-white font-semibold">Director de la publicación:</strong> Rémi Prével, presidente de MOTIOON.
          </p>
        </section>

        {/* Section 2 */}
        <section id="alojamiento" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            2. Alojamiento
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed">
            El sitio web y la aplicación web están alojados por:
          </p>
          <div className="bg-[#131E42] border border-[#263462] rounded-xl p-5 mb-4 shadow-sm">
            <p className="text-[#E8ECF7] leading-relaxed">
              <strong className="text-white">Vercel Inc.</strong><br />
              440 N Barranca Ave #4133, Covina, CA 91723, Estados Unidos<br />
              Sitio web: <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#3DFFA0] hover:underline">vercel.com</a>
            </p>
          </div>
          <p className="text-[#9FACD1] leading-relaxed">
            Determinados datos del servicio se alojan y procesan a través de los servicios Firebase de Google (Google Ireland Ltd, Gordon House, Barrow Street, Dublín 4, Irlanda). El nombre de dominio es gestionado por IONOS SE (Elgendorfer Str. 57, 56410 Montabaur, Alemania).
          </p>
        </section>

        {/* Section 3 */}
        <section id="propiedad" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            3. Propiedad intelectual
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed">
            Todos los elementos que componen el sitio safecallr.com y la aplicación SafeCallr (textos, gráficos, logotipos, interfaces, software, estructura, base de datos) son propiedad exclusiva de MOTIOON o se utilizan bajo licencia. Queda prohibida toda reproducción, representación, modificación, adaptación o explotación, total o parcial, sin la autorización previa por escrito de MOTIOON, lo que constituiría una infracción en el sentido de los artículos L.335-2 y siguientes del Código de la Propiedad Intelectual francés.
          </p>
          <p className="text-[#9FACD1] leading-relaxed">
            El nombre y la marca «SafeCallr», así como los logotipos asociados, no pueden utilizarse sin la autorización previa por escrito de MOTIOON.
          </p>
        </section>

        {/* Section 4 */}
        <section id="datos" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            4. Datos personales
          </h2>
          <p className="text-[#9FACD1] leading-relaxed">
            El tratamiento de los datos personales recogidos a través del sitio y de la aplicación se describe en nuestra{" "}
            <Link to="/privacidad" className="text-[#3DFFA0] hover:underline">
              Política de privacidad
            </Link>
            , que detalla los datos recogidos, sus finalidades, sus plazos de conservación y sus derechos.
          </p>
        </section>

        {/* Section 5 */}
        <section id="responsabilidad" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            5. Responsabilidad
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed">
            MOTIOON se esfuerza por garantizar la exactitud y la actualización de la información publicada en este sitio, cuyo contenido puede modificar en cualquier momento y sin previo aviso. No obstante, MOTIOON no puede garantizar la exactitud, la exhaustividad o la vigencia de toda la información puesta a disposición.
          </p>
          <p className="text-[#9FACD1] leading-relaxed">
            Los enlaces de hipertexto presentes en el sitio pueden dirigir a sitios de terceros sobre los que MOTIOON no ejerce ningún control; MOTIOON declina toda responsabilidad respecto a su contenido.
          </p>
        </section>

        {/* Section 6 */}
        <section id="derecho" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            6. Derecho aplicable
          </h2>
          <p className="text-[#9FACD1] leading-relaxed">
            El presente aviso legal se rige por el derecho francés. Cualquier litigio relativo al sitio safecallr.com se someterá, a falta de resolución amistosa, a los tribunales franceses competentes.
          </p>
        </section>

        {/* Section 7 */}
        <section id="contacto" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            7. Contacto
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed">
            Para cualquier cuestión relativa al sitio o al servicio:
          </p>
          <p className="text-[#E8ECF7] leading-relaxed">
            <strong className="text-white">MOTIOON — SafeCallr</strong><br />
            60 rue François I<sup>er</sup>, 75008 París, Francia<br />
            <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline">contact@safecallr.com</a>
          </p>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#263462] py-8 px-6 text-center text-sm text-[#9FACD1]">
        © 2026 MOTIOON — SafeCallr. Todos los derechos reservados.
      </footer>
    </div>
  );
}
