# Analyseur de Sentiment avec IA 🧠

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Une application web moderne qui analyse le sentiment (positif, négatif ou neutre) de n'importe quel texte en utilisant l'API Gemini de Google. L'application conserve un historique de vos analyses et vous permet de partager vos résultats.

## ## Fonctionnalités ✨
* **Analyse de Sentiment en Temps Réel** : Obtenez une classification (Positif, Négatif, Neutre) et une explication détaillée grâce à l'IA.
* **Historique des Analyses** : Toutes vos analyses sont sauvegardées et affichées dans une liste chronologique.
* **Partage de Résultats** : Générez un lien unique pour partager une analyse spécifique avec d'autres personnes.
* **Interface Réactive et Moderne** : Interface utilisateur épurée et entièrement réactive, conçue avec Tailwind CSS.
* **Authentification Anonyme** : Chaque utilisateur dispose d'un historique personnel sans avoir besoin de créer un compte.

---
## ## Technologies Utilisées 🛠️

* **Frontend** : [React](https://reactjs.org/) (via [Vite](https://vitejs.dev/))
* **Base de Données** : [Cloud Firestore](https://firebase.google.com/docs/firestore)
* **Authentification** : [Firebase Authentication](https://firebase.google.com/docs/auth)
* **Modèle d'IA** : [Google Gemini API](https://ai.google/gemini/)
* **Styling** : [Tailwind CSS](https://tailwindcss.com/)
* **Icônes** : [React Icons](https://react-icons.github.io/react-icons/)

---
## ## Démarrage Rapide (Getting Started) 🚀

Suivez ces instructions pour installer et lancer le projet sur votre machine locale.

### ### Prérequis
* [Node.js](https://nodejs.org/) (version 18.x ou supérieure)
* [npm](https://www.npmjs.com/)

### ### Installation

1.  **Clonez le dépôt :**
    ```sh
    git clone [https://github.com/a-khelfa/Sentiment-Analyzer-Web-App.git](https://github.com/a-khelfa/Sentiment-Analyzer-Web-App.git)
    cd Sentiment-Analyzer-Web-App
    ```

2.  **Installez les dépendances :**
    ```sh
    npm install
    ```

3.  **Configurez les variables d'environnement :**
    * Créez un fichier `.env` à la racine du projet.
    * Remplissez ce fichier avec vos propres clés d'API. Voir la section ci-dessous pour plus de détails.

4.  **Lancez le serveur de développement :**
    ```sh
    npm run dev
    ```
    L'application sera alors accessible à l'adresse `http://localhost:5173` (ou un autre port si celui-ci est occupé).

---
## ## Variables d'Environnement 🔑

Pour que l'application fonctionne, vous devez fournir des clés d'API dans un fichier `.env` à la racine du projet.

```env
# .env

# Clé API pour le modèle Google Gemini
# Obtenez la vôtre sur [https://aistudio.google.com/](https://aistudio.google.com/)
VITE_GEMINI_API_KEY="VOTRE_CLÉ_GEMINI_ICI"

# Configuration de votre projet Firebase (en une seule ligne)
# Obtenez la vôtre dans les paramètres de votre projet sur [https://console.firebase.google.com/](https://console.firebase.google.com/)
VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
