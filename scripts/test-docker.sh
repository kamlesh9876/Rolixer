#!/bin/bash

# Test Docker setup
echo "🧪 Testing Docker setup..."

# Check if docker-compose config is valid
echo "Validating docker-compose configuration..."
if docker-compose config > /dev/null 2>&1; then
    echo "✅ Docker Compose configuration is valid"
else
    echo "❌ Docker Compose configuration has errors"
    exit 1
fi

# Test building images
echo "Testing Docker image builds..."
if docker-compose build --no-cache > /dev/null 2>&1; then
    echo "✅ Docker images built successfully"
else
    echo "❌ Docker image build failed"
    exit 1
fi

echo "🎉 Docker setup test completed successfully!"