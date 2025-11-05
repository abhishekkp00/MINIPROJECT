#!/bin/bash

# Server Startup Script - Keeps Backend Running
# This script starts the backend server and keeps it running

echo "🚀 Starting Backend Server..."
echo ""

# Navigate to server directory
cd /home/abhishek/MINIPROJECT/server

# Start the server
npm run dev

# Note: Press Ctrl+C to stop the server
# The server will run continuously until stopped
