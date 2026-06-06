#!/bin/bash

echo "🧹 Cleaning up cache and database..."

# Remove Next.js cache
if [ -d ".next" ]; then
  rm -rf .next
  echo "✓ Removed .next cache"
fi

# Remove Prisma database
if [ -f "prisma/dev.db" ]; then
  rm -f prisma/dev.db prisma/dev.db-journal
  echo "✓ Removed Prisma database"
fi

# Flush Redis
if command -v redis-cli &> /dev/null; then
  redis-cli FLUSHALL > /dev/null 2>&1
  echo "✓ Flushed Redis cache"
fi

echo "✅ Cleanup complete!"
