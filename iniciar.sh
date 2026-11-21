#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js 20+ e npm são necessários. Instale-os antes de continuar."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "Instalando dependências do projeto (requer internet na primeira execução)..."
  npm install
fi
echo "Abrindo servidor local da Wolf Store..."
npm run dev
