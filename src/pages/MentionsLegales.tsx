import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import AppLogo from "../components/AppLogo";

export default function MentionsLegales() {
  return (
    <div id="mentions-legales-page" className="min-h-screen bg-[#0A1128] text-[#E8ECF7] font-sans">
      {/* Header Bar */}
      <header id="mentions-legales-header" className="bg-[#0F1B3D] text-white py-14 px-6 relative overflow-hidden border-b border-[#263462]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1B3D] to-[#0A1128] opacity-90 z-0"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-8">
            <Link id="mentions-legales-back-home" to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-[#3DFFA0] transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Retour à l'accueil
            </Link>
            
            <AppLogo />
          </div>

          <h1 id="mentions-legales-main-title" className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[#FFFFFF]">
            Mentions légales
          </h1>
          <p className="text-[#9FACD1] text-sm">
            Dernière mise à jour : <strong className="text-[#3DFFA0] font-semibold">18 juillet 2026</strong>
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main id="mentions-legales-main-content" className="max-w-3xl mx-auto px-6 py-10 md:py-16">

        {/* Section 1 */}
        <section id="editeur" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            1. Éditeur du site
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed">
            Le site safecallr.com et l'application SafeCallr sont édités par :
          </p>
          <div className="bg-[#131E42] border border-[#263462] rounded-xl p-5 mb-4 shadow-sm">
            <p className="text-[#E8ECF7] leading-relaxed">
              <strong className="text-white">MOTIOON</strong>, société par actions simplifiée unipersonnelle (SASU) au capital de <strong className="text-white">[CAPITAL SOCIAL] €</strong><br />
              Siège social : 60 rue François I<sup>er</sup>, 75008 Paris, France<br />
              Immatriculée au Registre du commerce et des sociétés de Paris sous le numéro 930 280 086<br />
              N° de TVA intracommunautaire : FR17 930 280 086<br />
              E-mail : <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline">contact@safecallr.com</a>
            </p>
          </div>
          <p className="text-[#9FACD1] leading-relaxed">
            <strong className="text-white font-semibold">Directeur de la publication :</strong> Rémi Prével, président de MOTIOON.
          </p>
        </section>

        {/* Section 2 */}
        <section id="hebergement" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            2. Hébergement
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed">
            Le site et l'application web sont hébergés par :
          </p>
          <div className="bg-[#131E42] border border-[#263462] rounded-xl p-5 mb-4 shadow-sm">
            <p className="text-[#E8ECF7] leading-relaxed">
              <strong className="text-white">Vercel Inc.</strong><br />
              440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
              Site : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#3DFFA0] hover:underline">vercel.com</a>
            </p>
          </div>
          <p className="text-[#9FACD1] leading-relaxed">
            Certaines données du service sont hébergées et traitées via les services Firebase de Google (Google Ireland Ltd, Gordon House, Barrow Street, Dublin 4, Irlande). Le nom de domaine est géré par IONOS SE (Elgendorfer Str. 57, 56410 Montabaur, Allemagne).
          </p>
        </section>

        {/* Section 3 */}
        <section id="propriete" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            3. Propriété intellectuelle
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed">
            L'ensemble des éléments composant le site safecallr.com et l'application SafeCallr (textes, graphismes, logos, interfaces, logiciels, structure, base de données) est la propriété exclusive de MOTIOON ou fait l'objet d'une autorisation d'utilisation. Toute reproduction, représentation, modification, adaptation ou exploitation, totale ou partielle, sans autorisation écrite préalable de MOTIOON est interdite et constitue une contrefaçon au sens des articles L.335-2 et suivants du Code de la propriété intellectuelle.
          </p>
          <p className="text-[#9FACD1] leading-relaxed">
            La marque et le nom « SafeCallr » ainsi que les logos associés ne peuvent être utilisés sans l'autorisation écrite préalable de MOTIOON.
          </p>
        </section>

        {/* Section 4 */}
        <section id="donnees" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            4. Données personnelles
          </h2>
          <p className="text-[#9FACD1] leading-relaxed">
            Le traitement des données personnelles collectées via le site et l'application est décrit dans notre{" "}
            <Link to="/confidentialite" className="text-[#3DFFA0] hover:underline">
              Politique de confidentialité
            </Link>
            , qui précise notamment les données collectées, leurs finalités, leurs durées de conservation et vos droits.
          </p>
        </section>

        {/* Section 5 */}
        <section id="responsabilite" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            5. Responsabilité
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed">
            MOTIOON s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site, dont elle se réserve le droit de modifier le contenu à tout moment et sans préavis. MOTIOON ne peut toutefois garantir l'exactitude, la complétude ou l'actualité de l'ensemble des informations mises à disposition.
          </p>
          <p className="text-[#9FACD1] leading-relaxed">
            Les liens hypertextes présents sur le site pouvant renvoyer vers des sites tiers, MOTIOON n'exerce aucun contrôle sur le contenu de ces sites et décline toute responsabilité à leur égard.
          </p>
        </section>

        {/* Section 6 */}
        <section id="droit" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            6. Droit applicable
          </h2>
          <p className="text-[#9FACD1] leading-relaxed">
            Les présentes mentions légales sont régies par le droit français. Tout litige relatif au site safecallr.com sera soumis, à défaut de résolution amiable, aux juridictions françaises compétentes.
          </p>
        </section>

        {/* Section 7 */}
        <section id="contact" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2">
            7. Contact
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed">
            Pour toute question relative au site ou au service :
          </p>
          <p className="text-[#E8ECF7] leading-relaxed">
            <strong className="text-white">MOTIOON — SafeCallr</strong><br />
            60 rue François I<sup>er</sup>, 75008 Paris, France<br />
            <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline">contact@safecallr.com</a>
          </p>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#263462] py-8 px-6 text-center text-sm text-[#9FACD1]">
        © 2026 MOTIOON — SafeCallr. Tous droits réservés.
      </footer>
    </div>
  );
}
