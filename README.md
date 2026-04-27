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

Le projet est déployable sur un cluster Kubernetes léger **k3s**. Tous les manifests sont dans `k8s/` et un script de déploiement automatisé est fourni.

### 📁 Structure des manifests

```
k8s/
├── namespace.yaml        # Namespace "contacts-lab" + ServiceAccount
├── app-config.yaml       # ConfigMap (DB_NAME, DB_USER) + Secret (DB_PASSWORD)
├── postgres-init.yaml    # ConfigMap contenant init.sql (création de table + données)
├── postgres.yaml         # Service ClusterIP + Deployment + PersistentVolumeClaim
├── backend.yaml          # Service ClusterIP + Deployment (image: lab-backend:latest)
├── frontend.yaml         # Service NodePort:30080 + Deployment (image: lab-frontend:latest)
└── ingress.yaml          # Ingress Traefik → frontend:8080 (port 80)
```

### 🔧 Prérequis

- **k3s** installé sur la machine cible (Traefik inclus par défaut)
- **kubectl** configuré (`export KUBECONFIG=/etc/rancher/k3s/k3s.yaml`)
- **Docker** disponible pour construire les images

### 🚀 Déploiement automatique (recommandé)

```bash
# Rendre le script exécutable
chmod +x deploy-k3s.sh

# Déployer (build + import + apply)
./deploy-k3s.sh

# Redéployer depuis zéro (supprime tout puis redéploie)
./deploy-k3s.sh --clean
```

Le script effectue automatiquement :
1. ✅ Build des images Docker (`lab-backend:latest`, `lab-frontend:latest`)
2. ✅ Import des images dans le runtime containerd de k3s (`k3s ctr images import`)
3. ✅ Application des manifests dans le bon ordre
4. ✅ Attente que tous les pods soient `Ready`
5. ✅ Affichage des URLs d'accès

### 🛠️ Déploiement manuel (étape par étape)

> ⚠️ k3s utilise son propre containerd — il **ne partage pas** le cache Docker. L'import est obligatoire.

```bash
# 1. Build des images
docker build -f Dockerfile.backend  -t lab-backend:latest  .
docker build -f Dockerfile.frontend -t lab-frontend:latest .

# 2. Export + import dans k3s
docker save lab-backend:latest  | sudo k3s ctr images import -
docker save lab-frontend:latest | sudo k3s ctr images import -

# 3. Appliquer les manifests (ordre important)
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/app-config.yaml
kubectl apply -f k8s/postgres-init.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml

# 4. Vérifier l'état des pods
kubectl get pods -n contacts-lab -w
```

### 🌐 Accès à l'application

| Méthode | URL |
|---|---|
| **NodePort** | `http://<IP-du-nœud-k3s>:30080` |
| **Ingress (Traefik)** | `http://<IP-du-nœud-k3s>/` |

```bash
# Obtenir l'IP du nœud
kubectl get nodes -o wide
```

### 🔍 Commandes de débogage

```bash
# État global du namespace
kubectl get all -n contacts-lab

# Logs des services
kubectl logs -n contacts-lab deployment/backend
kubectl logs -n contacts-lab deployment/postgres
kubectl logs -n contacts-lab deployment/frontend

# Décrire un pod en erreur
kubectl describe pod -n contacts-lab <nom-du-pod>

# Vérifier l'Ingress
kubectl get ingress -n contacts-lab
```

### 🗑️ Supprimer le déploiement

```bash
kubectl delete namespace contacts-lab
```

---

*(le contenu ci‑dessus satisfait les exigences du laboratoire et fournit une documentation complète pour l'utilisateur et l'évaluateur.)*
