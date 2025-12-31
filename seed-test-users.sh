#!/bin/bash

# Seed test users for testing centralized login system
# Linux/Mac shell script

set -e

echo ""
echo "===================================="
echo "Seeding Test Users"
echo "===================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Check if seed script exists
if [ ! -f "seed-test-users.js" ]; then
    echo "Error: seed-test-users.js not found"
    exit 1
fi

# Run the seed script
echo "Starting seed process..."
echo ""

node seed-test-users.js

if [ $? -ne 0 ]; then
    echo ""
    echo "Error: Seeding failed"
    exit 1
fi

echo ""
echo "✅ Seeding completed successfully!"
echo ""
