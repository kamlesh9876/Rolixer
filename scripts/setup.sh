#!/bin/bash

# Rolixer Project Setup Script
set -e

echo "🚀 Setting up Rolixer Store Rating Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check Node.js version
print_status "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_status "Current Node.js version: $NODE_VERSION"
    
    # Run Node.js version check
    if node scripts/check-node-version.js; then
        print_success "Node.js version is compatible"
    else
        print_error "Node.js version is incompatible"
        echo ""
        echo "Choose an option:"
        echo "1. Continue with Docker setup (recommended)"
        echo "2. Exit and upgrade Node.js manually"
        read -p "Enter your choice (1 or 2): " choice
        
        if [ "$choice" != "1" ]; then
            print_error "Setup cancelled. Please upgrade Node.js and run setup again."
            exit 1
        fi
        
        USE_DOCKER=true
    fi
else
    print_error "Node.js is not installed"
    exit 1
fi

# Check if Docker is available
print_status "Checking Docker availability..."
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    print_success "Docker and Docker Compose are available"
    DOCKER_AVAILABLE=true
else
    print_warning "Docker or Docker Compose not found"
    DOCKER_AVAILABLE=false
    
    if [ "$USE_DOCKER" = true ]; then
        print_error "Docker is required for Node.js compatibility. Please install Docker."
        exit 1
    fi
fi

# Create environment files
print_status "Setting up environment files..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    print_success "Created root .env file"
else
    print_warning "Root .env file already exists"
fi

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    print_success "Created backend .env file"
else
    print_warning "Backend .env file already exists"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    print_success "Created frontend .env file"
else
    print_warning "Frontend .env file already exists"
fi

# Generate secure JWT secret
print_status "Generating secure JWT secret..."
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
sed -i.bak "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/g" .env
sed -i.bak "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/g" backend/.env
rm -f .env.bak backend/.env.bak
print_success "Generated and set secure JWT secret"

# Setup based on available tools
if [ "$USE_DOCKER" = true ] || [ "$DOCKER_AVAILABLE" = true ]; then
    print_status "Setting up with Docker..."
    
    # Build Docker images
    print_status "Building Docker images..."
    docker-compose build
    
    print_success "Docker setup complete!"
    echo ""
    echo "🐳 To start the application with Docker:"
    echo "   docker-compose up                    # Production mode"
    echo "   docker-compose --profile dev up     # Development mode with hot reload"
    echo ""
    echo "📱 Application URLs:"
    echo "   Frontend: http://localhost:3001"
    echo "   Backend API: http://localhost:3000/api/v1"
    echo "   Health Check: http://localhost:3000/api/v1/health"
    
else
    print_status "Setting up for local development..."
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    print_success "Backend dependencies installed"
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
    
    print_success "Local setup complete!"
    echo ""
    echo "💻 To start the application locally:"
    echo "   # Terminal 1 - Start PostgreSQL and Redis"
    echo "   # Terminal 2 - Backend:"
    echo "   cd backend && npm run start:dev"
    echo "   # Terminal 3 - Frontend:"
    echo "   cd frontend && npm start"
    echo ""
    echo "📱 Application URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:3000/api/v1"
    echo "   Health Check: http://localhost:3000/api/v1/health"
fi

echo ""
print_success "🎉 Setup complete!"
echo ""
print_warning "⚠️  SECURITY REMINDERS:"
echo "   1. Change default database passwords in production"
echo "   2. Review SECURITY.md for production deployment"
echo "   3. Never commit .env files to version control"
echo ""
print_status "📚 Next steps:"
echo "   1. Review the SECURITY.md file"
echo "   2. Check the CI/CD pipeline in .github/workflows/ci.yml"
echo "   3. Start developing your application!"