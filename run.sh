#!/bin/sh

echo Building...
npm run build
echo Running...
node dist/index.js
echo Done!