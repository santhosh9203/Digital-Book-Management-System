#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Installing Root Dependencies ---"
npm install --production=false

echo "--- Building Client ---"
cd client
npm install --production=false
npm run build
cd ..

echo "--- Installing Server Dependencies ---"
cd server
npm install
cd ..

echo "--- Build Complete ---"
