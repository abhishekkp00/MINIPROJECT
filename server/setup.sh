#!/bin/bash

# AI-Integrated Project Management Application
# Complete Backend Setup Script

echo "================================================"
echo "🚀 AI Project Management Backend Setup"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created. Please edit it with your configuration.${NC}"
    echo ""
    echo -e "${YELLOW}Required configuration:${NC}"
    echo "  - MONGODB_URI (your MongoDB connection string)"
    echo "  - JWT_SECRET (generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\")"
    echo "  - OPENAI_API_KEY (get from https://platform.openai.com/api-keys)"
    echo ""
    read -p "Press Enter after editing .env file..."
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18 or higher is required${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo ""
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Create uploads directory
if [ ! -d "uploads" ]; then
    mkdir uploads
    echo -e "${GREEN}✅ Created uploads directory${NC}"
fi

# Test MongoDB connection
echo ""
echo -e "${BLUE}🔍 Testing MongoDB connection...${NC}"
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connection successful');
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ MongoDB connection test failed${NC}"
    echo -e "${YELLOW}Please check your MONGODB_URI in .env file${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ Backend Setup Complete!${NC}"
echo "================================================"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "🌐 Server will run on: http://localhost:5000"
echo "📚 API Documentation: http://localhost:5000/api/health"
echo ""
echo "📋 Next Steps:"
echo "  1. Ensure MongoDB is running"
echo "  2. Verify .env configuration"
echo "  3. Run 'npm run dev' to start server"
echo "  4. Test with: curl http://localhost:5000/api/health"
echo ""
echo "================================================"
