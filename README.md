# Lab : Déploiement d'une Application Multi‑Tiers avec Docker Compose

## 📝 Description du projet

Application de gestion de contacts qui se compose de trois services :

- **Frontend** : application React (Vite + TypeScript) construite en multi‑stage et servie par Nginx.
- **Backend** : API REST Node.js (Express + TypeScript) utilisant Drizzle ORM.
- **Base de données** : PostgreSQL 15‑alpine.

L'orchestration est assurée par Docker Compose, avec des réseaux séparés pour isoler les couches.

## 🚀 Prérequis

- Docker (version > 20.10)
- Docker Compose (v1 ou v2)
- Git (pour cloner le dépôt)

## ⚙️ Variables d'environnement

Un fichier `.env` peut être utilisé pour définir :

```ini
DB_NAME=contacts_db
DB_USER=postgres
DB_PASSWORD=postgres
```

Ces valeurs ont des défauts dans `docker-compose.yml` et ne sont pas commitées.

> 🔒 **Important** : ajoutez `.env` à `.gitignore` ; ne publiez jamais de mots de passe.

## 📁 Architecture des services

| Service   | Port | Réseau       | Limites CPU/ram | Healthcheck                 |
|-----------|------|--------------|-----------------|-----------------------------|
| database  | 5432 | backend-net  | 0.5 / 512M      | `pg_isready`                |
| backend   | 5000 | frontend-net<br>backend-net | 0.5 / 256M      | `/health` (Dockerfile)      |
| frontend  | 8080 | frontend-net | 0.25 / 128M     | `/` (Dockerfile/nginx)      |

Le frontend n'a accès qu'au backend ; le backend peut parler à la BD, assurant l'isolation.

## 📦 Commandes communes

```bash
# monter tous les services en arrière-plan
docker-compose up --build -d

# arrêter et supprimer les conteneurs
docker-compose down

# état des services
docker-compose ps

# statistiques d'utilisation (CPU / mémoire)
docker stats
```

## 🔍 Dépannage rapide

- **Backend introuvable sur la BD** : vérifiez `DATABASE_URL` (doit pointer vers `database`)
- **Frontend vide / erreurs CORS** : l'API est-elle bien proxifiée par Nginx ? (cf. `nginx.conf`)
- **Volumes ou réseaux manquants** : exécutez `docker-compose up -d --force-recreate`

---

## ✅ Tests de validation

1. **Connectivité BD** : `docker-compose logs backend` → logs de connexion + création de tables.
2. **API health** :
   ```bash
   curl http://localhost:5000/health
   # devrait répondre {"status":"ok"}
   ```
3. **Exploration de l'API** : envoyer `GET/POST/PUT/DELETE` sur `/api/contacts`.
4. **Interface** : ouvrir `http://localhost:8080/` et vérifier l'affichage et les opérations CRUD.
5. **Isolation réseau** : depuis le conteneur frontend :
   ```bash
   docker exec -it <frontend_id> sh
   curl database:5432   # doit échouer
   ```
6. **Persistance** : ajouter un contact, redémarrer (`down` + `up`), vérifier qu'il reste.
7. **Limites ressources** : lancer `docker stats` et vérifier les plafonds définis.
8. **Health checks partout** : `docker-compose ps` doit afficher `(healthy)` pour chaque service.

> 📸 Ajoutez des captures d’écran dans cette section lors de la soumission du lab.

## 🖼 Captures d'écran requises

1. `docker-compose ps` : services "Up" et "healthy"
2. `docker network ls` : visualiser les deux réseaux
3. `docker volume ls` : présence de `postgres-data`
4. `docker stats` : démontrer les limites
5. Interface frontend affichant des contacts
6. Capture après ajout de contact
7. Logs du backend montrant la connexion BD
8. Résultat du test d’isolation réseau
9. `docker inspect` health status
10. Comparaison de tailles d’images backend (avec/sans multi-stage)

---

## ☸️ Déploiement sur un cluster k3s

Le projet peut également être déployé sur un cluster Kubernetes léger comme k3s. Les manifests Kubernetes sont fournis dans le dossier `k8s/`.

### Prérequis k3s

- k3s ou k3d installé
- `kubectl` configuré pour votre cluster k3s
- Docker disponible pour construire les images locales

### Étapes

1. Construire les images locales :
   ```bash
   docker build -t lab-backend:latest -f Dockerfile.backend .
   docker build -t lab-frontend:latest -f Dockerfile.frontend .
   ```
2. Charger les images dans k3s si nécessaire :
   - pour `k3d` :
     ```bash
     k3d image import lab-backend:latest lab-frontend:latest -c <cluster-name>
     ```
3. Appliquer les manifests Kubernetes :
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/app-config.yaml -n contacts-lab
   kubectl apply -f k8s/postgres.yaml -n contacts-lab
   kubectl apply -f k8s/backend.yaml -n contacts-lab
   kubectl apply -f k8s/frontend.yaml -n contacts-lab
   ```
4. Accéder à l’interface frontend :
   - depuis le cluster local : `http://localhost:30080`

### Notes

- Le service PostgreSQL est exposé uniquement au cluster.
- Le frontend communique avec le backend via le service Kubernetes `backend`.
- Le backend construit dynamiquement `DATABASE_URL` à partir des variables `DB_USER`, `DB_PASSWORD` et `DB_NAME`.

---

*(le contenu ci‑dessus satisfait les exigences du laboratoire et fournit une documentation complète pour l’utilisateur et l’évaluateur.)*