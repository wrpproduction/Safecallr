import React from "react";
import { ArrowLeft, Globe, FileText, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import AppLogo from "../components/AppLogo";

export default function Cgu() {
  const scrollToId = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div id="cgu-page" className="min-h-screen bg-[#0A1128] text-[#E8ECF7] font-sans">
      {/* Header Bar */}
      <header id="cgu-header" className="bg-[#0F1B3D] text-white py-14 px-6 relative overflow-hidden border-b border-[#263462]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1B3D] to-[#0A1128] opacity-90 z-0"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <Link id="cgu-back-home" to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-[#3DFFA0] transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Retour à l'accueil
            </Link>
            
            {/* Language Switcher Pills */}
            <div className="flex items-center gap-2 bg-[#131E42] border border-[#263462] px-3 py-1.5 rounded-full text-xs font-bold text-[#9FACD1]">
              <Globe size={14} className="text-[#3DFFA0]" />
              <span className="text-[#3DFFA0]">FR</span>
              <span className="text-[#263462]">|</span>
              <Link to="/terms" className="hover:text-[#3DFFA0] transition-colors">EN</Link>
              <span className="text-[#263462]">|</span>
              <Link to="/terminos" className="hover:text-[#3DFFA0] transition-colors">ES</Link>
            </div>

            <AppLogo />
          </div>

          <h1 id="cgu-main-title" className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[#FFFFFF]">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-[#9FACD1] text-sm">
            Version 1.0 — <strong className="text-[#3DFFA0] font-semibold">Juillet 2026</strong>
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main id="cgu-main-content" className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        
        {/* Prevalence disclaimer */}
        <div id="cgu-prevalence" className="bg-[#131E42] border border-[#263462] rounded-xl p-4 mb-10 text-sm text-[#9FACD1] leading-relaxed italic">
          Les présentes CGU sont rédigées en français. En cas de traduction dans une autre langue, la version française prévaut.
        </div>

        {/* Table of Contents */}
        <nav id="cgu-toc" className="bg-[#131E42] border border-[#263462] rounded-xl p-6 mb-12 shadow-sm">
          <h2 className="text-xs uppercase tracking-widest font-bold text-[#3DFFA0] mb-4 flex items-center gap-2">
            <FileText size={16} /> Sommaire
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs md:text-sm">
            <li><a href="#art1" onClick={(e) => scrollToId(e, "art1")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 1 — Éditeur du service</a></li>
            <li><a href="#art2" onClick={(e) => scrollToId(e, "art2")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 2 — Objet</a></li>
            <li><a href="#art3" onClick={(e) => scrollToId(e, "art3")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 3 — Définitions</a></li>
            <li><a href="#art4" onClick={(e) => scrollToId(e, "art4")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 4 — Description du Service</a></li>
            <li><a href="#art5" onClick={(e) => scrollToId(e, "art5")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 5 — Acceptation et modification</a></li>
            <li><a href="#art6" onClick={(e) => scrollToId(e, "art6")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 6 — Inscription et compte</a></li>
            <li><a href="#art7" onClick={(e) => scrollToId(e, "art7")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 7 — Vérification Utilisateurs Pro</a></li>
            <li><a href="#art8" onClick={(e) => scrollToId(e, "art8")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 8 — Obligations et usages interdits</a></li>
            <li><a href="#art9" onClick={(e) => scrollToId(e, "art9")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 9 — Conditions financières</a></li>
            <li><a href="#art10" onClick={(e) => scrollToId(e, "art10")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 10 — Disponibilité du Service</a></li>
            <li><a href="#art11" onClick={(e) => scrollToId(e, "art11")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 11 — Responsabilité</a></li>
            <li><a href="#art12" onClick={(e) => scrollToId(e, "art12")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 12 — Propriété intellectuelle</a></li>
            <li><a href="#art13" onClick={(e) => scrollToId(e, "art13")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 13 — Données personnelles</a></li>
            <li><a href="#art14" onClick={(e) => scrollToId(e, "art14")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 14 — Durée et résiliation</a></li>
            <li><a href="#art15" onClick={(e) => scrollToId(e, "art15")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 15 — Médiation et litiges</a></li>
            <li><a href="#art16" onClick={(e) => scrollToId(e, "art16")} className="text-[#E8ECF7] hover:text-[#3DFFA0] hover:underline transition-colors block py-0.5">Article 16 — Dispositions générales</a></li>
          </ol>
        </nav>

        {/* Article 1 */}
        <section id="art1" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 1 — Éditeur du service
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Le service SafeCallr (ci-après le « Service »), accessible à l'adresse <a href="https://safecallr.com" target="_blank" rel="noopener noreferrer" className="text-[#3DFFA0] hover:underline">https://safecallr.com</a> ainsi que via les applications mobiles SafeCallr disponibles sur l'App Store et Google Play, est édité par :
          </p>
          <div className="bg-[#131E42] border border-[#263462] rounded-xl p-5 mb-4 shadow-sm">
            <p className="text-[#E8ECF7] leading-relaxed">
              <strong className="text-white">Motioon</strong>, société par actions simplifiée unipersonnelle (SASU) au capital de 1 000 euros, immatriculée au Registre du commerce et des sociétés sous le numéro SIRET 930 280 086 00015, dont le siège social est situé 60 rue François I<sup>er</sup>, 75008 Paris, France (ci-après « Motioon » ou l'« Éditeur »).<br />
              Directeur de la publication : Monsieur Rémi Prével, Président.<br />
              Contact : <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline font-medium">contact@safecallr.com</a>
            </p>
          </div>
        </section>

        {/* Article 2 */}
        <section id="art2" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 2 — Objet
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Les présentes Conditions Générales d'Utilisation (ci-après les « CGU ») ont pour objet de définir les conditions dans lesquelles les utilisateurs (ci-après les « Utilisateurs ») accèdent au Service et l'utilisent.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Toute inscription au Service et toute utilisation du Service impliquent l'acceptation pleine et entière des présentes CGU. L'Utilisateur qui n'accepte pas les CGU doit renoncer à utiliser le Service.
          </p>
        </section>

        {/* Article 3 */}
        <section id="art3" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 3 — Définitions
          </h2>
          <ul className="list-disc list-inside space-y-3 text-[#9FACD1] leading-relaxed text-justify">
            <li><strong className="text-white">« Service » :</strong> la plateforme SafeCallr de vérification d'identité téléphonique, dans ses versions web et mobiles.</li>
            <li><strong className="text-white">« Utilisateur Particulier » :</strong> toute personne physique utilisant le Service à des fins personnelles et non professionnelles.</li>
            <li><strong className="text-white">« Utilisateur Professionnel » :</strong> toute personne physique ou morale utilisant le Service dans le cadre de son activité professionnelle, après vérification de son statut conformément à l'article 7.</li>
            <li><strong className="text-white">« Organisation » :</strong> toute personne morale disposant d'un espace SafeCallr Business permettant la vérification entre collaborateurs.</li>
            <li><strong className="text-white">« Code de Vérification » :</strong> code numérique à usage unique et à durée de validité limitée, généré par le Service dans le cadre d'une demande de vérification.</li>
            <li><strong className="text-white">« Demande de Vérification » :</strong> sollicitation adressée par un Utilisateur à un autre Utilisateur en vue de confirmer l'identité de l'appelant au cours d'un échange téléphonique ou en visioconférence.</li>
          </ul>
        </section>

        {/* Article 4 */}
        <section id="art4" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 4 — Description du Service
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            SafeCallr est un outil d'aide à la vérification de l'identité d'un interlocuteur lors d'un échange téléphonique ou en visioconférence. Son principe de fonctionnement est le suivant : l'appelant déclenche depuis son interface une Demande de Vérification ; le destinataire reçoit une notification sur son application ; un Code de Vérification à usage unique est généré ; l'appelant communique ce code oralement au destinataire, qui le saisit dans son application pour confirmer la concordance.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Le Code de Vérification n'est jamais transmis au destinataire par notification, par SMS ou par tout autre canal écrit : sa communication orale par l'appelant constitue le cœur du mécanisme de vérification.
          </p>
          <p className="text-[#9FACD1] mb-2 leading-relaxed font-semibold text-white">Le Service comprend trois modules :</p>
          <ul className="list-disc list-inside space-y-2 text-[#9FACD1] mb-4 leading-relaxed text-justify pl-2">
            <li><strong className="text-white">SafeCallr P2P :</strong> vérification mutuelle entre particuliers, proposée à titre gratuit ;</li>
            <li><strong className="text-white">SafeCallr Pro :</strong> vérification de l'identité d'un professionnel auprès de ses clients, proposée par abonnement ;</li>
            <li><strong className="text-white">SafeCallr Business :</strong> vérification interne entre collaborateurs d'une même Organisation.</li>
          </ul>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Le Service ne collecte et ne traite aucune donnée biométrique : aucune reconnaissance vocale ni faciale n'est mise en œuvre. La vérification repose exclusivement sur des codes éphémères à usage unique.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Le Service est fourni dans le cadre d'une première version (produit minimum viable). L'Éditeur ne revendique à ce stade aucune certification de sécurité (notamment CSPN ou qualification SecNumCloud) et ne présente pas le Service comme un dispositif certifié.
          </p>
        </section>

        {/* Article 5 */}
        <section id="art5" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 5 — Acceptation et modification des CGU
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            L'acceptation des CGU intervient lors de la création du compte, par une case à cocher renvoyant aux présentes. Les CGU applicables sont celles en vigueur à la date d'utilisation du Service.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            L'Éditeur se réserve la faculté de modifier les CGU à tout moment et à sa seule discrétion, notamment pour tenir compte des évolutions du Service, de son offre ou de la réglementation. Les Utilisateurs seront informés de toute modification substantielle par tout moyen approprié (notification dans l'application ou courriel) avec un préavis raisonnable. La poursuite de l'utilisation du Service après l'entrée en vigueur des CGU modifiées vaut acceptation de celles-ci.
          </p>
        </section>

        {/* Article 6 */}
        <section id="art6" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 6 — Inscription et compte
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            L'inscription au Service est réservée aux personnes physiques majeures disposant de la capacité juridique, ou aux mineurs d'au moins quinze ans dans les conditions prévues par la réglementation applicable en matière de protection des données personnelles.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            L'Utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de son inscription, et à les maintenir à jour pendant toute la durée d'utilisation du Service. La création d'un compte sous une fausse identité ou pour le compte d'un tiers sans autorisation est interdite.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Les identifiants de connexion sont strictly personnels et confidentiels. L'Utilisateur est responsable de la préservation de leur confidentialité et de toute activité réalisée depuis son compte. Il s'engage à informer sans délai l'Éditeur de toute utilisation non autorisée de son compte.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            L'utilisation du Service requiert un appareil compatible, une connexion à Internet et l'activation des notifications de l'application. Les coûts de connexion et d'équipement demeurent à la charge de l'Utilisateur.
          </p>
        </section>

        {/* Article 7 */}
        <section id="art7" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 7 — Vérification du statut des Utilisateurs Professionnels
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            L'accès aux fonctionnalités SafeCallr Pro est subordonné à une vérification préalable du statut professionnel du demandeur par l'Éditeur, sur la base de justificatifs (notamment extrait d'immatriculation, justificatifs d'inscription auprès d'ordres, de chambres professionnelles ou de registres réglementés). L'Éditeur se réserve le droit de refuser ou de retirer le statut d'Utilisateur Professionnel à tout demandeur ne satisfaisant pas à ces vérifications, ou dont les justificatifs se révéleraient inexacts.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            La vérification du statut professionnel ne constitue ni une caution, ni une garantie de la probité de l'Utilisateur Professionnel concerné, ni une garantie de la qualité des prestations qu'il fournit par ailleurs à ses clients.
          </p>
        </section>

        {/* Article 8 */}
        <section id="art8" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 8 — Obligations des Utilisateurs et usages interdits
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            L'Utilisateur s'engage à utiliser le Service conformément à sa destination, aux présentes CGU et à la réglementation en vigueur. Sont notamment interdits, sans que cette liste soit limitative :
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#9FACD1] mb-4 leading-relaxed text-justify pl-2">
            <li>toute utilisation du Service à des fins d'usurpation d'identité, de fraude, de démarchage abusif ou de harcèlement ;</li>
            <li>la communication d'un Code de Vérification par un canal écrit (SMS, messagerie, courriel) ou sa divulgation à un tiers ;</li>
            <li>toute tentative de contournement, d'altération ou de test d'intrusion des mesures de sécurité du Service sans autorisation écrite préalable de l'Éditeur ;</li>
            <li>toute extraction, reproduction ou utilisation automatisée des données du Service (scraping), et toute surcharge volontaire de l'infrastructure ;</li>
            <li>la revente, la sous-licence ou la mise à disposition du Service à des tiers hors des cas expressément prévus ;</li>
            <li>l'utilisation du Service pour transmettre des contenus illicites, diffamatoires ou portant atteinte aux droits de tiers.</li>
          </ul>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Tout manquement aux présentes obligations peut entraîner la suspension ou la résiliation du compte dans les conditions de l'article 14, sans préjudice de toute action que l'Éditeur pourrait engager.
          </p>
        </section>

        {/* Article 9 */}
        <section id="art9" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 9 — Conditions financières
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Le module SafeCallr P2P est fourni à titre gratuit aux Utilisateurs Particuliers. L'Éditeur se réserve le droit de faire évoluer son offre, sous réserve d'en informer préalablement les Utilisateurs.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Les modules SafeCallr Pro et SafeCallr Business sont proposés par abonnement, selon les tarifs et modalités communiqués avant la souscription. Les conditions particulières applicables aux abonnements professionnels (durée, facturation, renouvellement, résiliation) sont précisées lors de la souscription et, le cas échéant, dans des conditions générales de vente distinctes.
          </p>
        </section>

        {/* Article 10 */}
        <section id="art10" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 10 — Disponibilité et évolution du Service
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            L'Éditeur s'efforce d'assurer l'accessibilité du Service 24 heures sur 24 et 7 jours sur 7. Il est toutefois tenu à une obligation de moyens : l'accès au Service peut être interrompu, suspendu ou limité, notamment pour des opérations de maintenance, des mises à jour, des pannes, des cas de force majeure ou du fait de tiers (opérateurs, hébergeurs, fournisseurs de services de notification).
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            La délivrance des notifications dépend en outre de facteurs extérieurs à l'Éditeur : réglages de l'appareil de l'Utilisateur, autorisations accordées à l'application, connectivité, et services de notification des systèmes d'exploitation. L'Éditeur ne garantit pas la réception de chaque notification en toutes circonstances.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Le Service étant en développement actif, l'Éditeur peut faire évoluer, remplacer ou supprimer des fonctionnalités. Les évolutions substantielles affectant les services payants feront l'objet d'une information préalable.
          </p>
        </section>

        {/* Article 11 */}
        <section id="art11" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 11 — Responsabilité
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            SafeCallr est un outil d'aide à la décision. Le Service permet de vérifier qu'un interlocuteur a accès, en temps réel, à un compte SafeCallr déterminé et, pour les Utilisateurs Professionnels, que ce compte a fait l'objet de la vérification de statut décrite à l'article 7. Le Service ne garantit pas, en revanche, l'absence de toute fraude, la probité de l'interlocuteur, ni la véracité des propos tenus au cours de l'échange.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            La décision de donner suite à un échange, de communiquer des informations ou d'effectuer une opération (notamment un paiement ou un virement) relève de la seule responsabilité de l'Utilisateur. L'Éditeur recommande de ne jamais communiquer de données bancaires, mots de passe ou codes de sécurité au cours d'un appel, même vérifié.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            La responsabilité de l'Éditeur ne saurait être engagée notamment : en cas d'utilisation du Service non conforme aux CGU ; en cas de divulgation d'un Code de Vérification par un Utilisateur ; en cas de compromission de l'appareil ou des identifiants de l'Utilisateur ; du fait des contenus et propos échangés entre Utilisateurs ; ou en raison de dommages indirects tels que perte de chance, perte de données ou préjudice commercial.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Pour les Utilisateurs Professionnels, et dans la mesure permise par la loi, la responsabilité totale de l'Éditeur, toutes causes confondues, est limitée au montant des sommes effectivement versées par l'Utilisateur Professionnel au titre des douze mois précédant le fait générateur.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Aucune stipulation des présentes n'a pour objet d'exclure ou de limiter la responsabilité de l'Éditeur en cas de dol, de faute lourde, de dommage corporel, ou dans tout autre cas où une telle exclusion serait prohibée par la loi. À l'égard des consommateurs, les limitations prévues au présent article ne s'appliquent que dans la mesure permise par le Code de la consommation.
          </p>
        </section>

        {/* Article 12 */}
        <section id="art12" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 12 — Propriété intellectuelle
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Le Service, sa structure, ses interfaces, ses logiciels, sa charte graphique, ses textes, la marque et le nom « SafeCallr » ainsi que les logos associés sont protégés par le droit de la propriété intellectuelle et demeurent la propriété exclusive de Motioon ou de ses concédants. Une enveloppe e-Soleau a par ailleurs été déposée auprès de l'INPI à titre de preuve d'antériorité.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            L'inscription au Service confère à l'Utilisateur un droit d'utilisation personnel, non exclusif, non cessible et non transférable du Service, pour la durée de son inscription et conformément à sa destination. Toute reproduction, représentation, adaptation ou exploitation non expressément autorisée est interdite.
          </p>
        </section>

        {/* Article 13 */}
        <section id="art13" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 13 — Données personnelles
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Les traitements de données à caractère personnel mis en œuvre dans le cadre du Service sont décrits dans la{" "}
            <Link to="/confidentialite" className="text-[#3DFFA0] hover:underline font-semibold">
              Politique de confidentialité
            </Link>
            , accessible à l'adresse <a href="https://safecallr.com/confidentialite" className="text-[#3DFFA0] hover:underline">https://safecallr.com/confidentialite</a>, qui fait partie intégrante du cadre contractuel. L'Utilisateur est invité à en prendre connaissance avant toute inscription.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Pour toute question ou pour exercer ses droits, l'Utilisateur peut s'adresser à : <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline font-medium">contact@safecallr.com</a>.
          </p>
        </section>

        {/* Article 14 */}
        <section id="art14" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 14 — Durée, suspension et résiliation
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Les CGU s'appliquent pendant toute la durée d'utilisation du Service.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            L'Utilisateur peut cesser d'utiliser le Service et demander la suppression de son compte à tout moment, depuis l'application ou en écrivant à <a href="mailto:contact@safecallr.com" className="text-[#3DFFA0] hover:underline font-medium">contact@safecallr.com</a>. La suppression du compte entraîne la désactivation des fonctionnalités de vérification qui lui sont associées.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            L'Éditeur peut suspendre, avec effet immédiat, l'accès d'un Utilisateur au Service en cas de manquement grave ou répété aux présentes CGU, de suspicion sérieuse de fraude ou d'usurpation, d'atteinte à la sécurité du Service, ou sur injonction d'une autorité compétente. Sauf urgence ou impossibilité, l'Utilisateur en est informé avec indication des motifs et mis en mesure de présenter ses observations. La résiliation du compte peut être prononcée si le manquement n'est pas régularisé ou en cas de manquement rendant impossible le maintien de la relation contractuelle.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            L'Éditeur peut également cesser de fournir tout ou partie du Service, sous réserve d'un préavis raisonnable notifié aux Utilisateurs, et, pour les services payants, du remboursement au prorata des sommes versées pour la période non exécutée.
          </p>
        </section>

        {/* Article 15 */}
        <section id="art15" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 15 — Médiation et litiges de consommation
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Conformément aux articles L. 612-1 et suivants du Code de la consommation, l'Utilisateur consommateur peut recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable de tout litige l'opposant à l'Éditeur. Le médiateur désigné est :
          </p>
          <div className="bg-[#131E42] border border-[#263462] rounded-xl p-5 mb-4 shadow-sm">
            <p className="text-[#E8ECF7] leading-relaxed">
              <strong className="text-white">CM2C — Centre de la Médiation de la Consommation de Conciliateurs de justice</strong><br />
              49 rue de Ponthieu, 75008 Paris<br />
              Site web : <a href="https://www.cm2c.net" target="_blank" rel="noopener noreferrer" className="text-[#3DFFA0] hover:underline inline-flex items-center gap-1">www.cm2c.net <ExternalLink size={12} /></a><br />
              <span className="text-xs text-[#9FACD1] italic">(inscription en cours d'adhésion par l'Éditeur)</span>
            </p>
          </div>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            L'Utilisateur peut également recourir à la plateforme européenne de règlement en ligne des litiges :{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#3DFFA0] hover:underline inline-flex items-center gap-1">
              https://ec.europa.eu/consumers/odr <ExternalLink size={12} />
            </a>.
          </p>
        </section>

        {/* Article 16 */}
        <section id="art16" className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-[#FFFFFF] pt-2 border-b border-[#263462] pb-2">
            Article 16 — Dispositions générales
          </h2>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Si l'une quelconque des stipulations des CGU était déclarée nulle ou inapplicable, les autres stipulations conserveraient leur pleine validité. Le fait pour l'Éditeur de ne pas se prévaloir d'un manquement ne vaut pas renonciation à s'en prévaloir ultérieurement.
          </p>
          <p className="text-[#9FACD1] mb-4 leading-relaxed text-justify">
            Les CGU sont rédigées en français et peuvent être traduites en d'autres langues à titre informatif. En cas de divergence, la version française prévaut.
          </p>
          <p className="text-[#9FACD1] leading-relaxed text-justify">
            Les CGU sont soumises au droit français. Tout litige relatif à leur interprétation ou à leur exécution relève, à défaut de résolution amiable, des juridictions françaises compétentes. À l'égard des Utilisateurs Professionnels, compétence exclusive est attribuée au Tribunal de commerce de Paris, nonobstant pluralité de défendeurs ou appel en garantie.
          </p>
        </section>

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-[#263462] flex flex-wrap justify-between items-center gap-4 text-xs font-bold uppercase tracking-wider text-[#9FACD1]">
          <Link to="/confidentialite" className="hover:text-[#3DFFA0] transition-colors">Politique de confidentialité</Link>
          <Link to="/mentions-legales" className="hover:text-[#3DFFA0] transition-colors">Mentions légales</Link>
        </div>
      </main>
    </div>
  );
}
