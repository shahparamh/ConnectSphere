#!/bin/bash

# ConnectSphere Startup Script
# This script ensures ports are clear and starts both backend and frontend.

echo "🛑 Stopping existing services on ports 5001 and 5173..."
lsof -ti :5001 | xargs kill -9 2>/dev/null
lsof -ti :5173 | xargs kill -9 2>/dev/null

echo "🚀 Starting ConnectSphere Services..."

# Run concurrently from root
npm run dev
