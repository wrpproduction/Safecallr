export interface BlogArticle {
  id: string;
  slug: string;
  metaTitle: string;
  title: string;
  category: "grand_public" | "professionnel";
  categoryLabel: string;
  summary: string;
  metaDescription: string;
  seoKeywords: string;
  imageUrl: string;
  createdAt: string;
  author: string;
  content: string;
  geoTargeting?: string;
  published?: boolean;
}

export const DEFAULT_BLOG_ARTICLES: BlogArticle[] = [
  {
    id: "comment-reconnaitre-arnaque-faux-conseiller-bancaire",
    slug: "comment-reconnaitre-arnaque-faux-conseiller-bancaire",
    metaTitle: "comment-reconnaitre-arnaque-faux-conseiller-bancaire",
    title: "Comment reconnaître une arnaque au faux conseiller bancaire en 2026 ?",
    category: "grand_public",
    categoryLabel: "Grand Public & Familles",
    summary: "Analyse détaillée des techniques de spoofing téléphonique utilisées par les escrocs pour usurper le numéro officiel de votre banque, et les réflexes de sécurité SafeCallr pour protéger vos comptes.",
    metaDescription: "Guide pratique 2026 : apprenez à déjouer les arnaques au faux conseiller bancaire. Découvrez le spoofing de numéro et la solution SafeCallr pour valider vos appels en temps réel.",
    seoKeywords: "faux conseiller bancaire, arnaque téléphonique, spoofing banque, sécurité bancaire, SafeCallr, authentification appel, 2FA téléphone",
    imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    createdAt: "2026-02-01T10:00:00.000Z",
    author: "Comité de Vigilance Cybersécurité SafeCallr",
    geoTargeting: "France & Europe",
    published: true,
    content: `
# Comment reconnaître une arnaque au faux conseiller bancaire en 2026 ?

L'arnaque au faux conseiller bancaire représente aujourd'hui plus de **300 millions d'euros de préjudice annuel** en France. Les escrocs exploitent la confiance des épargnants grâce à une technique redoutable : le **spoofing téléphonique**.

---

## Qu'est-ce que le spoofing de numéro de téléphone ?

Le spoofing permet à un individu malveillant de modifier l'identifiant d'appelant (*Caller ID*) affiché sur votre écran de téléphone. Même si le numéro qui s'affiche est **exactement celui enregistré dans vos contacts** comme étant le service fraude de votre banque, l'appel provient en réalité d'un centre d'appel frauduleux.

### Le scénario type de l'escroquerie

1. **La prise de contact urgente :** L'escroc vous appelle en prétendant qu'une transaction frauduleuse de plusieurs milliers d'euros est en cours sur votre compte bancaire.
2. **La mise en confiance :** Il égrène des informations personnelles vous concernant (nom, adresse, début de numéro de carte) obtenues lors de fuites de données antérieures.
3. **La fausse annulation :** Il vous demande de valider une notification push sur votre application bancaire ou de lui dicter un code SMS reçu à l'instant, sous prétexte d'annuler le virement. En réalité, vous validez l'ajout d'un nouveau bénéficiaire ou un transfert d'argent sortant.

---

## Pourquoi les mesures traditionnelles ne suffisent plus ?

- **Le SMS de validation (OTP) :** Il est facilement détourné par ingénierie sociale ou usurpation de SIM.
- **L'affichage du numéro officiel :** Il n'a plus aucune valeur de preuve en raison des faiblesses originelles des réseaux télécoms.

---

## La solution SafeCallr : La double authentification humaine d'appel

Face à ce fléau, **SafeCallr** introduit la certification réciproque d'appel en temps réel.

1. **Demande de preuve instantanée :** Lorsque vous recevez un appel suspect de votre banque, demandez à l'interlocuteur d'envoyer un jeton d'authentification SafeCallr.
2. **Notification cryptographique :** Un jeton sécurisé s'affiche instantanément sur votre application mobile SafeCallr.
3. **Si l'appelant refuse ou hésite :** Vous avez la certitude absolue qu'il s'agit d'une tentative d'usurpation d'identité.

Ne donnez plus jamais suite à un appel d'urgence sans l'avoir certifié au préalable via l'application SafeCallr.
`
  },
  {
    id: "spoofing-telephonique-comment-les-escrocs-usurpent-votre-numero",
    slug: "spoofing-telephonique-comment-les-escrocs-usurpent-votre-numero",
    metaTitle: "spoofing-telephonique-comment-les-escrocs-usurpent-votre-numero",
    title: "Spoofing Téléphonique : Comment les pirates usurpent les numéros officiels",
    category: "grand_public",
    categoryLabel: "Technologie & Cybersécurité",
    summary: "Comprendre les vulnérabilités du protocole d'identification de l'appelant (Caller ID) et comment la technologie cryptographique SafeCallr restaure la confiance numérique.",
    metaDescription: "Tout comprendre sur le spoofing de numéro de téléphone : vulnérabilités du Caller ID, cadre légal MAN et comment SafeCallr sécurise la voix.",
    seoKeywords: "spoofing telephonique, Caller ID spoofing, piratage telephone, usurpation numero, reseau telecom, SafeCallr, authentification voix",
    imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
    createdAt: "2026-01-20T14:30:00.000Z",
    author: "Équipe R&D SafeCallr",
    geoTargeting: "Mondial",
    published: true,
    content: `
# Spoofing Téléphonique : Comment les pirates usurpent les numéros officiels

Le réseau téléphonique commuté a été conçu dans les années 1970 avec une hypothèse fondamentale : les opérateurs télécoms se font une confiance implicite. Cette architecture originale est aujourd'hui exploitée par des réseaux criminels à l'échelle mondiale.

---

## Les coulisses techniques du Caller ID Spoofing

Lorsqu'un appel est émis via la voix sur IP (VoIP), l'émetteur peut configurer librement le champ d'entête SIP \`From:\`. Les serveurs Asterisk ou logiciels d'appel automatisés permettent de définir n'importe quel numéro à 10 chiffres.

### Le mécanisme en 3 étapes :

1. **Abonnement VoIP sans vérification :** L'escroc souscrit un service d'appel VoIP auprès d'un fournisseur peu scrupuleux.
2. **Personnalisation du champ CLI :** Il renseigne le numéro officiel d'un établissement bancaire ou d'une administration publique.
3. **Acheminement vers la victime :** L'opérateur téléphonique destinataire affiche le numéro transmis sans être en mesure de vérifier son authenticité à la source.

---

## Cadre réglementaire et limites du mécanisme MAN

En France, la loi Naegelen et le plan de numérotation imposent aux opérateurs d'interrompre les appels dont l'identifiant n'est pas certifié. Cependant :

- Les appels provenant de passerelles internationales échappent encore partiellement au filtrage.
- Le chiffrement de bout en bout du réseau télécom ne garantit pas la légitimité de l'interlocuteur humain au bout du fil.

---

## Comment SafeCallr garantit l'intégrité de l'appelant

SafeCallr ne se fie pas au réseau télécom pour valider l'identité. En combinant un canal de données sécurisé et une signature cryptographique temporaire, SafeCallr crée une passerelle hors-bande (*out-of-band*) inviolable entre l'appelant et l'appelé.
`
  },
  {
    id: "fraude-au-president-proteger-votre-entreprise",
    slug: "fraude-au-president-proteger-vteger-votre-entreprise",
    metaTitle: "fraude-au-president-proteger-votre-entreprise",
    title: "Fraude au Président et Usurpation d'Identité : Protéger son Entreprise",
    category: "professionnel",
    categoryLabel: "Entreprises & PME",
    summary: "Les PME et grands groupes font face à des pertes colossales dues aux faux ordres de virement exécutés par téléphone. Découvrez le protocole d'authentification renforcée SafeCallr Pro.",
    metaDescription: "Comment protéger votre entreprise contre la fraude au président et les fausses instructions de virement. Guide complet et protocole de sécurité SafeCallr.",
    seoKeywords: "fraude au president, arnaque virement, securite entreprise, usurpation identite direction, SafeCallr pro, authentification entreprise",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    createdAt: "2026-01-10T09:15:00.000Z",
    author: "Département Sécurité Entreprises SafeCallr",
    geoTargeting: "B2B France & International",
    published: true,
    content: `
# Fraude au Président et Usurpation d'Identité : Protéger son Entreprise

La **fraude au président** (ou FOVI pour *Faux Ordres de Virement d'Entreprise*) consiste à contacter un collaborateur du service comptable ou financier en se faisant passer pour le dirigeant ou le cabinet d'avocat de l'entreprise, afin d'exiger un virement urgent et confidentiel.

---

## L'impact dévastateur de l'ingénierie sociale

Les escrocs réalisent une préparation minutieuse avant de passer à l'action :
- **Recherche d'organigramme :** Identification des responsables comptables sur LinkedIn et réseaux professionnels.
- **Période stratégique :** Appel en fin de journée ou pendant les vacances du dirigeant.
- **Tone & Pression psychologique :** Discours autoritaire exigeant la discrétion absolue (*"opération de rachat ultra-confidentielle"*).

---

## L'avènement du Deepfake Vocal (Vishing par IA)

Avec les progrès de l'intelligence artificielle générative, il est désormais possible de cloner la voix d'un dirigeant à partir de quelques minutes d'enregistrement vidéo public. L'analyse vocale humaine ne permet plus d'identifier un imposteur.

---

## La réponse opérationnelle SafeCallr Entreprise

1. **Protocole de validation obligatoire :** Tout ordre de virement inhabituel transmis par téléphone doit faire l'objet d'un jeton de validation SafeCallr émis depuis le compte certifié du dirigeant.
2. **Piste d'audit infalsifiable :** Chaque vérification d'appel génère un journal d'horodatage chiffré, garantissant le respect des procédures internes et simplifiant les contrôles de conformité (DORA / ISO 27001).
`
  }
];
