#!/bin/bash

echo "🚀 Takara DeFi - Docker Compose Deployment Script"
echo "================================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found! Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file and set your passwords before continuing!"
    echo "   Required changes:"
    echo "   - DB_PASSWORD"
    echo "   - JWT_SECRET"
    echo "   - ADMIN_PASSWORD"
    echo "   - VITE_API_URL (your server IP)"
    echo ""
    read -p "Press Enter after editing .env file..."
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed!"
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker installed"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not installed!"
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
fi

echo ""
echo "📦 Building and starting containers..."
docker-compose down
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Your application is running:"
echo "   Frontend: http://$(hostname -I | awk '{print $1}')"
echo "   Backend API: http://$(hostname -I | awk '{print $1}')/api"
echo "   Admin Panel: http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop all: docker-compose down"
echo "   Restart: docker-compose restart"
echo "   Update: git pull && ./deploy.sh"
echo ""
