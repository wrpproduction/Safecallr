# SafeCallr

SafeCallr est une application mobile et web conçue pour protéger les utilisateurs contre l'usurpation d'identité et les appels frauduleux. Elle permet de vérifier l'identité des appelants (professionnels ou particuliers) en temps réel grâce à un système de code de sécurité unique.

## Fonctionnalités principales

- **Vérification d'identité Pro** : Vérifiez qu'un conseiller bancaire ou une administration est bien qui il prétend être.
- **Demandes Personnelles** : Sécurisez les échanges entre proches.
- **Tableau de bord de sécurité** : Historique des demandes et alertes en temps réel.
- **Gestion des contacts de confiance** : Listez vos banques et contacts réguliers pour des vérifications plus rapides.

## Technologies utilisées

- **Frontend** : React 19, TypeScript, Tailwind CSS, Framer Motion (animations).
- **Backend/Base de données** : Firebase (Authentication, Firestore).
- **Plateforme** : Vite.

## Installation et Développement

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/wrpproduction/safecallr.git
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Configurez les variables d'environnement (voir `.env.example`).
4. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

## Déploiement

Le projet est configuré pour être déployé sur des plateformes comme Vercel, Netlify ou Google Cloud Run.
Assurez-vous de configurer les clés Firebase dans les variables d'environnement de votre plateforme de déploiement.

---
© 2026 SafeCallr - Sécurité et Confiance.
