#!/bin/bash

# Script untuk menjalankan migrasi database di Vercel
echo "Running Prisma migrations on Vercel..."
npx prisma migrate deploy
echo "Migrations completed successfully!"
