#!/bin/bash

# Lies die Variablen aus .env.deploy ein
if [ ! -f .env.deploy ]; then
  echo "❌ .env.deploy nicht gefunden! Bitte erst anlegen und konfigurieren."
  exit 1
fi
source .env.deploy

# Docker-Image lokal bauen
echo "🛠️  Baue Docker-Image..."
docker build -t $IMAGE_NAME .

# Exportiere das Image als TAR
echo "📦  Exportiere Image..."
docker save $IMAGE_NAME > backend-image.tar

# Übertrage Image auf den Server
echo "⏫  Übertrage Image auf den Server..."
scp -P $SERVER_PORT backend-image.tar $SERVER_USER@$SERVER_HOST:/tmp/

# Auf dem Server: Image laden und alten Container ersetzen
echo "🚀  Starte Deployment per SSH..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << EOF
  docker load < /tmp/backend-image.tar
  docker stop $CONTAINER_NAME || true
  docker rm $CONTAINER_NAME || true
  docker run -d --name $CONTAINER_NAME -p 5000:80 \
    --env ConnectionStrings__DefaultConnection=$CONNECTION_STRING \
    $IMAGE_NAME
  rm /tmp/backend-image.tar
EOF

echo "✅ Deployment abgeschlossen!"
