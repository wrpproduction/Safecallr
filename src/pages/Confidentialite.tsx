import React from "react";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Confidentialite() {
  const scrollToId = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div id="privacy-policy-page" className="min-h-screen bg-[#FAFBFD] text-[#0F1B3D] font-sans">
      {/* Header Bar */}
      <header id="privacy-header" className="bg-[#0F1B3D] text-white py-14 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1B3D] to-[#1E2E5D] opacity-90 z-0"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-8">
            <Link id="privacy-back-home" to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-[#3DFFA0] transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Retour à l'accueil
            </Link>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#3DFFA0] flex items-center justify-center shrink-0">
                <Shield className="text-[#0F1B3D] w-5 h-5" />
              </div>
              <span className="font-headline font-black text-lg tracking-tighter text-[#3DFFA0]">SafeCallr</span>
            </div>
          </div>

          <h1 id="privacy-main-title" className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Politique de confidentialité
          </h1>
          <p className="text-[#B9C3DC] text-sm">
            Dernière mise à jour : <strong className="text-[#3DFFA0] font-semibold">16 juillet 2026</strong> · Version 1.0
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main id="privacy-main-content" className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        
        {/* Intro */}
        <div id="privacy-intro-card" className="border-l-4 border-[#3DFFA0] pl-6 py-2 mb-10 text-[#2A3A66] text-lg leading-relaxed italic">
          <p>
            SafeCallr est un service d'authentification des interlocuteurs lors d'appels téléphoniques, conçu pour lutter contre la fraude et l'usurpation d'identité. La protection de vos données personnelles est au cœur de notre mission : cette politique explique de manière transparente quelles données nous collectons, pourquoi, combien de temps nous les conservons, et quels sont vos droits.
          </p>
        </div>

        {/* Table of Contents */}
        <nav id="privacy-toc" className="bg-white border border-[#E3E8F2] rounded-xl p-6 mb-12 shadow-sm">
          <h2 className="text-xs uppercase tracking-widest font-bold text-[#2A3A66] mb-4">
            Sommaire
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <li>
              <a href="#responsable" onClick={(e) => scrollToId(e, "responsable")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                1. Responsable de traitement
              </a>
            </li>
            <li>
              <a href="#donnees" onClick={(e) => scrollToId(e, "donnees")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                2. Données que nous collectons
              </a>
            </li>
            <li>
              <a href="#non-collecte" onClick={(e) => scrollToId(e, "non-collecte")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                3. Ce que SafeCallr ne collecte pas
              </a>
            </li>
            <li>
              <a href="#finalites" onClick={(e) => scrollToId(e, "finalites")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                4. Finalités et bases légales
              </a>
            </li>
            <li>
              <a href="#conservation" onClick={(e) => scrollToId(e, "conservation")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                5. Durées de conservation
              </a>
            </li>
            <li>
              <a href="#destinataires" onClick={(e) => scrollToId(e, "destinataires")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                6. Destinataires et sous-traitants
              </a>
            </li>
            <li>
              <a href="#transferts" onClick={(e) => scrollToId(e, "transferts")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                7. Transferts hors Union européenne
              </a>
            </li>
            <li>
              <a href="#securite" onClick={(e) => scrollToId(e, "securite")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                8. Sécurité
              </a>
            </li>
            <li>
              <a href="#droits" onClick={(e) => scrollToId(e, "droits")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                9. Vos droits
              </a>
            </li>
            <li>
              <a href="#age" onClick={(e) => scrollToId(e, "age")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                10. Âge minimum
              </a>
            </li>
            <li>
              <a href="#cookies" onClick={(e) => scrollToId(e, "cookies")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                11. Cookies
              </a>
            </li>
            <li>
              <a href="#modifications" onClick={(e) => scrollToId(e, "modifications")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                12. Modifications de cette politique
              </a>
            </li>
            <li>
              <a href="#contact" onClick={(e) => scrollToId(e, "contact")} className="hover:text-[#0E9C5C] hover:underline transition-colors block py-0.5">
                13. Contact
              </a>
            </li>
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-12 leading-relaxed text-base">
          
          <section id="responsable" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              1. Responsable de traitement
            </h2>
            <div className="space-y-3">
              <p>Le responsable du traitement des données personnelles collectées via l'application et le site SafeCallr est :</p>
              <p className="bg-white border border-[#E3E8F2] rounded-xl p-4 shadow-sm">
                <strong>MOTIOON</strong>, société par actions simplifiée unipersonnelle (SASU)<br />
                Siège social : 60 rue François I<sup>er</sup>, 75008 Paris, France<br />
                Immatriculée au RCS de Paris sous le numéro 930 280 086<br />
                Représentée par son président, Rémi Prével
              </p>
              <p>
                Pour toute question relative à vos données personnelles :{" "}
                <a href="mailto:contact@safecallr.com" className="text-[#0E9C5C] hover:underline font-medium">
                  contact@safecallr.com
                </a>
              </p>
              <p>
                MOTIOON n'a pas désigné de délégué à la protection des données (DPO), cette désignation n'étant pas obligatoire au regard de la nature et de l'échelle actuelles de ses traitements. Le point de contact ci-dessus traite l'ensemble des demandes relatives aux données personnelles.
              </p>
            </div>
          </section>

          <section id="donnees" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              2. Données que nous collectons
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#0F1B3D] mb-2">2.1 Données de compte (tous utilisateurs)</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Identité :</strong> nom complet ;</li>
                  <li><strong>Coordonnées :</strong> adresse e-mail, numéro de téléphone ;</li>
                  <li><strong>Authentification :</strong> mot de passe (stocké exclusivement sous forme chiffrée/hachée — nous n'avons jamais accès à votre mot de passe en clair) ;</li>
                  <li><strong>Type de compte :</strong> particulier ou professionnel.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0F1B3D] mb-2">2.2 Données de vérification professionnelle (comptes professionnels uniquement)</h3>
                <p>
                  Afin de garantir que seuls des professionnels légitimes peuvent revendiquer un statut professionnel vérifié — ce qui constitue le fondement de la protection offerte par SafeCallr — nous demandons aux professionnels un justificatif d'existence de leur entreprise ou de leur activité (extrait Kbis ou document équivalent attestant de l'existence légale de la structure).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0F1B3D] mb-2">2.3 Données d'utilisation du service</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Contacts sécurisés :</strong> la liste des utilisateurs SafeCallr avec lesquels vous avez établi une relation de vérification ;</li>
                  <li><strong>Historique des vérifications :</strong> date, interlocuteur concerné et résultat (identité confirmée ou non) de chaque demande d'authentification ;</li>
                  <li><strong>Codes de vérification :</strong> les codes à usage unique générés lors d'une demande d'authentification, qui expirent automatiquement à brève échéance ;</li>
                  <li><strong>Préférences :</strong> langue de l'application.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0F1B3D] mb-2">2.4 Données techniques</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Jeton de notification push (token FCM) :</strong> identifiant technique permettant de vous transmettre les notifications d'authentification sur votre appareil ;</li>
                  <li><strong>Plateforme utilisée :</strong> iOS, Android ou web ;</li>
                  <li><strong>Journaux techniques :</strong> journaux de connexion et d'erreurs strictement nécessaires au fonctionnement, à la sécurité et à la maintenance du service.</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="non-collecte" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              3. Ce que SafeCallr ne collecte pas
            </h2>
            <div className="bg-white border border-[#E3E8F2] border-l-4 border-l-[#3DFFA0] rounded-xl p-6 shadow-sm">
              <p className="font-semibold text-lg text-[#0F1B3D] mb-3">
                SafeCallr n'enregistre pas vos appels, ne collecte aucune donnée vocale et ne pratique aucune analyse biométrique.
              </p>
              <p className="text-sm text-[#2A3A66] mb-0">
                Le service fonctionne exclusivement par échange de codes de vérification : nous n'avons accès ni au contenu, ni à l'audio de vos conversations téléphoniques, qui se déroulent en dehors de l'application. SafeCallr n'accède pas au répertoire de votre téléphone sans votre autorisation et ne collecte pas votre localisation.
              </p>
            </div>
          </section>

          <section id="finalites" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              4. Finalités et bases légales
            </h2>
            <div className="overflow-x-auto border border-[#E3E8F2] rounded-xl shadow-sm bg-white">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0F1B3D] text-white">
                    <th className="p-4 font-semibold border-b border-[#E3E8F2]">Finalité</th>
                    <th className="p-4 font-semibold border-b border-[#E3E8F2]">Données concernées</th>
                    <th className="p-4 font-semibold border-b border-[#E3E8F2]">Base légale (art. 6 RGPD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8F2] text-[#2A3A66]">
                  <tr>
                    <td className="p-4 align-top">Création et gestion de votre compte, fourniture du service d'authentification</td>
                    <td className="p-4 align-top">Données de compte, contacts sécurisés, codes de vérification, token FCM</td>
                    <td className="p-4 align-top">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Vérification du statut professionnel des comptes professionnels</td>
                    <td className="p-4 align-top">Justificatif d'existence de l'entreprise (Kbis ou équivalent)</td>
                    <td className="p-4 align-top">Exécution du contrat et intérêt légitime (prévention de la fraude et de l'usurpation d'identité professionnelle)</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Historique de vos vérifications, consultable dans l'application</td>
                    <td className="p-4 align-top">Historique des vérifications</td>
                    <td className="p-4 align-top">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Sécurité, prévention des abus, maintenance du service</td>
                    <td className="p-4 align-top">Journaux techniques</td>
                    <td className="p-4 align-top">Intérêt légitime (sécurité du service et de ses utilisateurs)</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Réponse à vos demandes et support</td>
                    <td className="p-4 align-top">Coordonnées, contenu de vos demandes</td>
                    <td className="p-4 align-top">Exécution du contrat et intérêt légitime</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Respect de nos obligations légales (facturation des abonnements, comptabilité)</td>
                    <td className="p-4 align-top">Données de compte et de facturation des comptes professionnels</td>
                    <td className="p-4 align-top">Obligation légale</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-[#2A3A66]">
              Nous n'utilisons pas vos données à des fins de publicité ciblée et nous ne vendons pas vos données à des tiers.
            </p>
          </section>

          <section id="conservation" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              5. Durées de conservation
            </h2>
            <div className="overflow-x-auto border border-[#E3E8F2] rounded-xl shadow-sm bg-white">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0F1B3D] text-white">
                    <th className="p-4 font-semibold border-b border-[#E3E8F2]">Données</th>
                    <th className="p-4 font-semibold border-b border-[#E3E8F2]">Durée de conservation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8F2] text-[#2A3A66]">
                  <tr>
                    <td className="p-4 align-top">Données de compte</td>
                    <td className="p-4 align-top">Pendant toute la durée de vie du compte, puis suppression dans un délai de 30 jours après la clôture du compte</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Codes de vérification</td>
                    <td className="p-4 align-top">Supprimés automatiquement après leur expiration, et au plus tard 72 heures après leur génération</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Historique des vérifications</td>
                    <td className="p-4 align-top">12 mois glissants, puis suppression ou anonymisation</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Justificatif professionnel (Kbis ou équivalent)</td>
                    <td className="p-4 align-top">Pendant toute la durée de vie du compte professionnel, afin de pouvoir justifier à tout moment de la validité du statut vérifié</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Journaux techniques</td>
                    <td className="p-4 align-top">12 mois maximum</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Données de facturation (comptes professionnels)</td>
                    <td className="p-4 align-top">10 ans à compter de la clôture de l'exercice, conformément aux obligations comptables légales</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-[#2A3A66]">
              Certaines données peuvent être conservées au-delà de ces durées lorsque la loi l'exige ou pour la constatation, l'exercice ou la défense de droits en justice, pendant les délais de prescription applicables.
            </p>
          </section>

          <section id="destinataires" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              6. Destinataires et sous-traitants
            </h2>
            <p className="mb-4">
              Vos données sont accessibles uniquement au personnel habilité de MOTIOON et aux prestataires techniques strictement nécessaires au fonctionnement du service, agissant en qualité de sous-traitants au sens du RGPD :
            </p>
            <div className="overflow-x-auto border border-[#E3E8F2] rounded-xl shadow-sm bg-white mb-6">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0F1B3D] text-white">
                    <th className="p-4 font-semibold border-b border-[#E3E8F2]">Prestataire</th>
                    <th className="p-4 font-semibold border-b border-[#E3E8F2]">Rôle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8F2] text-[#2A3A66]">
                  <tr>
                    <td className="p-4 align-top">Google Ireland Ltd / Google LLC — Firebase</td>
                    <td className="p-4 align-top">Authentification des comptes, base de données, envoi des notifications push (FCM)</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">Vercel Inc.</td>
                    <td className="p-4 align-top">Hébergement de l'application web et du site safecallr.com</td>
                  </tr>
                  <tr>
                    <td className="p-4 align-top">IONOS SE</td>
                    <td className="p-4 align-top">Gestion du nom de domaine et services associés</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mb-3">
              Chaque sous-traitant est lié par des engagements contractuels de protection des données conformes à l'article 28 du RGPD. Par ailleurs, dans le cadre du fonctionnement même du service, certaines informations vous concernant (nom, statut vérifié) sont visibles par les utilisateurs avec lesquels vous établissez une relation de vérification — c'est l'objet du service.
            </p>
            <p>
              Vos données peuvent enfin être communiquées aux autorités compétentes lorsque la loi nous y oblige.
            </p>
          </section>

          <section id="transferts" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              7. Transferts hors Union européenne
            </h2>
            <p className="mb-3">
              Certains de nos prestataires (Google, Vercel) sont des sociétés américaines ou appartiennent à des groupes américains. Des transferts de données vers les États-Unis sont donc susceptibles d'intervenir dans le cadre de leurs prestations.
            </p>
            <p>
              Ces transferts sont encadrés par les mécanismes prévus par le RGPD : décision d'adéquation de la Commission européenne relative au cadre de protection des données UE–États-Unis (EU–US Data Privacy Framework), auquel Google et Vercel ont adhéré, et/ou clauses contractuelles types de la Commission européenne, complétées le cas échéant de mesures supplémentaires.
            </p>
          </section>

          <section id="securite" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              8. Sécurité
            </h2>
            <p className="mb-4">
              Nous mettons en œuvre des mesures techniques et organisationnelles alignées sur les bonnes pratiques du secteur pour protéger vos données, notamment :
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>chiffrement des données en transit (TLS) ;</li>
              <li>stockage des mots de passe exclusivement sous forme hachée ;</li>
              <li>codes de vérification à usage unique et à expiration automatique ;</li>
              <li>règles d'accès strictes aux bases de données, limitant chaque utilisateur à ses propres données ;</li>
              <li>principe de minimisation : nous ne collectons que les données nécessaires au service.</li>
            </ul>
            <p>
              Aucun système d'information ne peut toutefois être considéré comme infaillible. En cas de violation de données susceptible d'engendrer un risque pour vos droits et libertés, nous conseillerons la CNIL et, lorsque le risque est élevé, les personnes concernées, dans les conditions prévues aux articles 33 et 34 du RGPD.
            </p>
          </section>

          <section id="droits" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              9. Vos droits
            </h2>
            <p className="mb-4">
              Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants sur vos données personnelles :
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Droit d'accès :</strong> obtenir une copie des données que nous détenons sur vous ;</li>
              <li><strong>Droit de rectification :</strong> faire corriger des données inexactes ou incomplètes ;</li>
              <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données, notamment via la suppression de votre compte ;</li>
              <li><strong>Droit à la limitation :</strong> demander le gel temporaire du traitement de vos données ;</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et couramment utilisé ;</li>
              <li><strong>Droit d'opposition :</strong> vous opposer aux traitements fondés sur notre intérêt légitime, pour des raisons tenant à votre situation particulière ;</li>
              <li><strong>Directives post mortem :</strong> définir des directives relatives au sort de vos données après votre décès.</li>
            </ul>
            <p className="mb-3">
              Pour exercer ces droits, contactez-nous à{" "}
              <a href="mailto:contact@safecallr.com" className="text-[#0E9C5C] hover:underline font-medium">
                contact@safecallr.com
              </a>
              . Nous pourrons vous demander un justificatif d'identité en cas de doute raisonnable sur l'identité du demandeur. Nous répondons dans un délai d'un mois, prolongeable de deux mois pour les demandes complexes.
            </p>
            <p>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés (CNIL) :{" "}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#0E9C5C] hover:underline font-medium">
                www.cnil.fr
              </a>{" "}
              — CNIL, 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
            </p>
          </section>

          <section id="age" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              10. Âge minimum
            </h2>
            <p>
              SafeCallr est réservé aux personnes âgées de <strong>18 ans ou plus</strong>. En créant un compte, vous confirmez avoir au moins 18 ans. Si nous constatons qu'un compte a été créé par une personne mineure, nous procéderons à sa suppression.
            </p>
          </section>

          <section id="cookies" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              11. Cookies
            </h2>
            <p className="mb-3">
              L'application et le site SafeCallr utilisent uniquement des traceurs et des espaces de stockage local strictement nécessaires au fonctionnement du service (maintien de votre session, mémorisation de votre langue). Ces traceurs strictement nécessaires sont exemptés de consentement au sens des lignes directrices de la CNIL.
            </p>
            <p>
              Nous n'utilisons pas de cookies publicitaires. Si des outils de mesure d'audience venaient à être déployés, cette politique serait mise à jour et votre consentement serait recueilli lorsque la réglementation l'exige.
            </p>
          </section>

          <section id="modifications" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              12. Modifications de cette politique
            </h2>
            <p>
              Nous pouvons faire évoluer cette politique, notamment en cas d'évolution du service ou de la réglementation. La date de dernière mise à jour figure en haut de cette page. En cas de modification substantielle, nous vous en informerons par une notification dans l'application ou par e-mail.
            </p>
          </section>

          <section id="contact" className="scroll-mt-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1B3D] mb-4">
              13. Contact
            </h2>
            <p className="mb-3">Pour toute question relative à cette politique ou à vos données personnelles :</p>
            <p className="bg-white border border-[#E3E8F2] rounded-xl p-4 shadow-sm">
              <strong>MOTIOON — SafeCallr</strong><br />
              60 rue François I<sup>er</sup>, 75008 Paris, France<br />
              <a href="mailto:contact@safecallr.com" className="text-[#0E9C5C] hover:underline font-medium">
                contact@safecallr.com
              </a>
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer id="privacy-footer" className="border-t border-[#E3E8F2] py-8 px-6 text-center text-sm text-[#2A3A66] bg-white">
        <div className="max-w-3xl mx-auto">
          © 2026 MOTIOON SASU — SafeCallr. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
