# Application Bassin — accès depuis n'importe où (version 1.4.1)

L'ESP32 du bassin se connecte de lui-même, en connexion chiffrée, à un serveur
MQTT gratuit (EMQX Cloud Serverless). L'application, hébergée gratuitement sur
GitHub Pages, passe par ce serveur. Aucun port n'est ouvert sur la Freebox.

```
Téléphone (application)  ⇄  serveur MQTT EMQX Cloud  ⇄  ESP32 du bassin
      port 8084 (WebSocket chiffré)      port 8883 (MQTT chiffré)
```

À la maison, l'interface servie par l'ESP32 (`http://bassin.local`) fonctionne
toujours, même sans internet.

> **Pourquoi plus HiveMQ ?** L'offre gratuite HiveMQ Cloud Serverless ferme le
> 31 décembre 2026 et ne permet plus de créer de serveur. Ce que le site HiveMQ
> propose aujourd'hui (« Lab », 25 connexions) est un logiciel à installer
> soi-même sur un ordinateur : ce n'est pas ce qu'il nous faut.

## Contenu de ce dossier

| Fichier | Rôle |
|---|---|
| `index.html` | L'application (la même page que sur l'ESP32) |
| `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png` | Rendent l'application installable sur le téléphone |
| `LISEZMOI.md` | Ce guide |

## 1. Créer le serveur MQTT (EMQX Cloud Serverless, gratuit)

1. Créer un compte sur <https://www.emqx.com/en/cloud> (« Get Started Free »),
   sans carte bancaire.
2. Dans la console : **New Deployment** → **Serverless**. Choisir une région
   en Europe si elle est proposée (Francfort par exemple).
3. **Spend Limit : laisser 0.** Avec 0, le serveur n'utilise que le quota
   gratuit mensuel (1 million de minutes de connexion, 1 Go d'échanges) et
   s'arrête au lieu de facturer s'il était dépassé. Valider.
4. Page **Overview** du déploiement : noter l'**adresse** (de la forme
   `xxxxxxxx.ala.eu-central-1.emqxsl.com`). Les ports affichés doivent être
   `8883` (MQTT over TLS) et `8084` (WebSocket over TLS).
5. Menu **Access Control** → **Client Authentication** → **+ Add** : créer
   **deux** identifiants :
   - `esp32` (pour le bassin) ;
   - `telephone` (pour l'application).

   Choisir des mots de passe longs et différents. Si un téléphone est perdu, il
   suffit de changer le mot de passe `telephone`.

## 2. Mettre à jour l'ESP32 (programme 1.4.1)

1. Dans l'IDE Arduino, installer la bibliothèque **PubSubClient** (Nick O'Leary),
   si ce n'est pas déjà fait.
2. Garder le schéma de partition **Minimal SPIFFS (1.9MB APP with OTA/190KB SPIFFS)**.
3. Téléverser `Bassin_Wifi.ino` : par le WiFi (port réseau « bassin ») ou par
   la page `/update`.
4. Envoyer le nouveau `index.html` à l'ESP32 : Paramètres > Système >
   « envoyer un nouveau index.html ».

## 3. Relier l'ESP32 au serveur

Sur la page locale (`http://bassin.local`) : **Paramètres > Accès à distance (MQTT)**

- Serveur : l'adresse notée à l'étape 1 (un copier-coller avec `mqtts://` ou
  `:8883` est accepté, ils sont retirés)
- Port : `8883`
- Identifiant : `esp32`, et son mot de passe
- Identifiant du bassin : laisser la valeur proposée (`bassin/xxxxxx`), **à noter**

Enregistrer : la ligne d'état doit passer à « connecté » en quelques secondes.
Dans la console EMQX, **Overview** doit alors indiquer 1 connexion.

## 4. Mettre l'application en ligne (GitHub Pages, gratuit)

1. Créer un compte sur <https://github.com>, puis un dépôt **public** nommé
   `bassin` (le dépôt ne contient aucun mot de passe).
2. « Add file » → « Upload files » : déposer `index.html`,
   `manifest.webmanifest`, `sw.js`, `icon-192.png` et `icon-512.png`, puis
   « Commit changes ».
3. **Settings → Pages** : Source « Deploy from a branch », branche `main`,
   dossier `/ (root)`, Save.
4. Après une à deux minutes, l'application est en ligne à l'adresse
   `https://<ton-pseudo>.github.io/bassin/`.

## 5. Installer l'application sur le téléphone

1. Ouvrir l'adresse GitHub Pages dans le navigateur du téléphone.
2. Dans la fenêtre « Connexion à ton bassin » : le serveur (même adresse), le
   port `8084`, l'identifiant `telephone` et son mot de passe, l'identifiant du
   bassin noté à l'étape 3. Ces informations restent sur le téléphone.
3. Installer l'application :
   - Android (Chrome) : menu ⋮ → « Installer l'application » ou « Ajouter à
     l'écran d'accueil » ;
   - iPhone (Safari) : bouton Partager → « Sur l'écran d'accueil ».
4. Tester en 4G, WiFi coupé.

## Bon à savoir

- **Quota gratuit** : l'ESP32 connecté en permanence consomme environ
  43 000 minutes de connexion par mois sur 1 million, et 15 à 50 Mo d'échanges
  sur 1 Go (état toutes les 5 min, toutes les 2 s quand l'application est
  ouverte). La consommation du mois est visible sur la page Overview.
- **Mise en veille du serveur** : EMQX arrête un déploiement resté 30 jours
  sans aucune connexion, puis le supprime 30 jours plus tard s'il n'est pas
  relancé. Si le bassin est débranché tout un hiver, relancer le déploiement
  depuis la console au retour (ou le recréer et refaire les étapes 1, 3 et 5).
- **Mettre à jour la page** : `index.html` est à deux endroits, sur l'ESP32
  (`/upload`) et sur GitHub (déposer le nouveau fichier par-dessus l'ancien).
- **Ce qui reste réservé au réseau de la maison** : réglages WiFi, ntfy,
  serveur MQTT, mise à jour du programme et de la page.
- **Certificat** : le programme reconnaît les autorités utilisées par EMQX
  (DigiCert Global Root CA, G2 et G3) et par Let's Encrypt (ISRG Root X1 et X2) :
  il fonctionne aussi avec un autre serveur MQTT sur TLS.
- **Si l'ESP32 indique « connexion impossible (adresse, port ou certificat) »** :
  vérifier l'adresse, le port 8883, l'identifiant et le mot de passe. En dernier
  recours, passer `MQTT_VERIFIER_CERTIFICAT` à `false` dans le programme, pour
  un essai seulement : si ça marche alors, c'est le certificat (me le signaler).
- **Si le bassin perd internet**, l'application affiche « Le bassin n'est pas
  connecté au serveur » avec l'heure du dernier état reçu. Le bassin, lui,
  continue de fonctionner normalement.
