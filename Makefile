# Nom du projet
PROJECT_NAME = mesabos

default: help

# Démarrer les services
test:
	echo "Hello Makefile!"

start:
	docker compose up -d

# Arrêter les services
stop:
	docker compose down

# Construire les images
build:
	docker compose build

# Redémarrer les services
restart: stop start

# Voir les logs du front
flogs:
	docker logs mesabos_front -f

# Voir les logs du front
blogs:
	docker logs mesabos_bdd -f

# Nettoyer les containers, images et volumes (ATTENTION : supprime les volumes)
clean:
	docker compose down -v
	docker system prune -af

# Afficher l'aide
help:
	@echo "Usage: make [command]"
	@echo ""
	@echo "Commandes disponibles :"
	@echo "  start      - Démarrer les services Docker en arrière-plan"
	@echo "  stop       - Arrêter les services Docker"
	@echo "  restart    - Redémarrer les services Docker"
	@echo "  build      - Construire les images Docker"
	@echo "  logs       - Voir les logs des services"
	@echo "  clean      - Supprimer les containers, images et volumes Docker"
	@echo "  help       - Afficher cette aide"
