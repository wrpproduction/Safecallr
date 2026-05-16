import { motion } from "framer-motion";
import { ChevronDown, Plus, Minus } from "lucide-react";
import { useState } from "react";

interface FAQItemProps {
  question: string;
  answer: string;
  key?: number | string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:text-primary transition-colors group"
      >
        <h3 className="text-lg md:text-xl font-headline font-bold pr-8">{question}</h3>
        <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="pb-8 text-slate-400 leading-relaxed text-base md:text-lg">
          {answer}
        </p>
      </motion.div>
    </div>
  );
}

export default function FAQSection() {
  const faqs = [
    {
      category: "Comprendre la fraude téléphonique",
      items: [
        {
          question: "Qu'est-ce que l'usurpation d'identité téléphonique (spoofing) ?",
          answer: "L'usurpation d'identité téléphonique, ou spoofing, est une technique permettant à un fraudeur d'afficher un numéro de téléphone légitime sur l'écran de sa victime, comme celui de sa banque. Selon l'Observatoire de la sécurité des moyens de paiement, cette manipulation est au cœur de la majorité des fraudes au faux conseiller bancaire. SafeCallr neutralise cette menace en authentifiant l'humain derrière l'appel, et non simplement le numéro affiché."
        },
        {
          question: "Comment reconnaître un faux conseiller bancaire au téléphone ?",
          answer: "Un faux conseiller bancaire utilise souvent l'urgence ou la peur pour obtenir vos codes secrets ou vous demander de valider des opérations sur votre application bancaire (comme Sécur'Pass). Une banque ne vous demandera jamais vos codes d'accès par téléphone. Si vous avez un doute, SafeCallr permet de lever l'incertitude en 10 secondes en demandant au conseiller de prouver son identité via un code unique partagé de manière sécurisée."
        },
        {
          question: "Qu'est-ce que le vishing (voice phishing) ?",
          answer: "Le vishing est une forme de phishing par voix où des attaquants utilisent le téléphone pour soutirer des informations confidentielles. Les outils de filtrage classiques sont de plus en plus contournés par l'Intelligence Artificielle capable de cloner des voix (deepfakes). SafeCallr répond à ce défi en imposant un protocole d'authentification active qui ne repose pas sur la reconnaissance vocale mais sur un échange de preuves numériques synchronisées."
        }
      ]
    },
    {
      category: "Comment fonctionne SafeCallr",
      items: [
        {
          question: "Comment SafeCallr peut-il prouver l'identité d'un appelant ?",
          answer: "SafeCallr crée un canal de confiance éphémère entre l'appelant professionnel et le client. Lorsqu'un professionnel initie une vérification, l'application SafeCallr du client affiche instantanément un code unique. Le professionnel doit alors lire ce même code à voix haute. Cette synchronisation en temps réel garantit que l'appelant a un accès légitime à l'infrastructure sécurisée de son organisation, rendant l'usurpation techniquement impossible."
        },
        {
          question: "Existe-t-il un équivalant du 2FA pour les appels ?",
          answer: "Oui, SafeCallr est l'équivalent de l'authentification à deux facteurs (2FA) appliqué aux communications vocales. Alors que le 2FA classique protège vos comptes en ligne, SafeCallr protège vos conversations. En ajoutant cette couche de sécurité, nous transformons une conversation risquée en un échange certifié, conformément aux recommandations de l'ACPR sur la sécurisation des interactions sensibles."
        },
        {
          question: "SafeCallr est-il compatible avec tous les téléphones ?",
          answer: "SafeCallr est une application indépendante qui fonctionne parallèlement à votre appel téléphonique, qu'il soit sur mobile ou sur ligne fixe. La solution est compatible avec tous les smartphones (iOS et Android) et ne nécessite aucune modification de votre abonnement téléphonique. Pour les professionnels, elle s'intègre via une interface web ou une API, permettant une utilisation immédiate sans installation matérielle complexe."
        }
      ]
    },
    {
      category: "Pour qui et comment ça se déploie",
      items: [
        {
          question: "Pourquoi ma banque devrait-elle utiliser SafeCallr ?",
          answer: "Les banques sont les premières cibles des fraudes au faux conseiller, avec un préjudice annuel dépassant les 340 millions d'euros en France selon la Banque de France. SafeCallr permet aux établissements financiers de protéger leurs clients contre le spoofing et de réduire drastiquement les pertes liées à l'ingénierie sociale. C'est une solution de confiance qui renforce la relation client en mettant fin à la suspicion lors de chaque appel sortant."
        },
        {
          question: "Comment un notaire ou un avocat peut sécuriser ses appels ?",
          answer: "Les professions réglementées manipulent des fonds et des données hautement sensibles, ce qui les expose à la fraude au président ou à l'usurpation. En utilisant SafeCallr, un notaire ou un expert-comptable peut prouver son identité à son client avant de discuter d'un virement ou de détails contractuels. Le déploiement est instantané via notre espace professionnel certifié, garantissant une protection immédiate de votre responsabilité civile professionnelle."
        },
        {
          question: "Est-ce gratuit pour les particuliers ?",
          answer: "La protection des particuliers contre la fraude est notre priorité : l'application SafeCallr est totalement gratuite pour tous les clients finaux. Les coûts sont supportés par les institutions et les professionnels qui souhaitent certifier leur identité et sécuriser leurs clients. Vous pouvez télécharger l'application dès maintenant sur l'App Store ou Google Play pour ne plus jamais subir de doute lors d'un appel entrant."
        }
      ]
    },
    {
      category: "Sécurité et conformité",
      items: [
        {
          question: "SafeCallr est-il conforme au RGPD ?",
          answer: "La conformité au RGPD est intégrée dès la conception (Privacy by Design) de SafeCallr. Nous ne collectons que le strict minimum de données nécessaires à l'authentification. Les échanges de codes sont éphémères et ne sont jamais stockés avec les données personnelles. Toutes nos infrastructures sont hébergées en Europe sur des serveurs sécurisés, garantissant une souveraineté et une protection totale de vos informations conformément à la réglementation européenne."
        },
        {
          question: "La solution est-elle vulnérable aux deepfakes voix ?",
          answer: "Non, et c'est la force de SafeCallr. Les deepfakes voix permettent d'imiter une personne, mais ils ne permettent pas à un attaquant de deviner un code aléatoire généré en temps réel sur l'application sécurisée du client. SafeCallr est la seule solution qui protège contre la manipulation humaine augmentée par l'Intelligence Artificielle en exigeant une preuve numérique synchronisée hors-bande."
        }
      ]
    }
  ];

  return (
    <section id="faq" className="py-32 px-6 bg-surface-container-lowest scroll-mt-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-headline font-black text-4xl md:text-6xl tracking-tight mb-6">
            Vos questions sur la <span className="text-primary">sécurité.</span>
          </h2>
          <p className="text-xl text-slate-400">
            Tout ce qu'il faut savoir pour lutter efficacement contre la fraude téléphonique professionnelle.
          </p>
        </div>

        <div className="space-y-12">
          {faqs.map((group, idx) => (
            <div key={idx}>
              <h3 className="text-primary font-bold uppercase tracking-[0.2em] text-xs mb-6 border-l-2 border-primary pl-4">
                {group.category}
              </h3>
              <div className="space-y-0">
                {group.items.map((faq, i) => (
                  <FAQItem key={i} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
