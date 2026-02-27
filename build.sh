#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Installing Root Dependencies ---"
npm install

echo "--- Building Client ---"
cd client
npm install
npm run build
cd ..

echo "--- Installing Server Dependencies ---"
cd server
npm install
cd ..

echo "--- Build Complete ---"
