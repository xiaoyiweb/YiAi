#!/bin/bash

set -e

cd admin/
pnpm build
cd ..

cd chat/
pnpm build
cd ..

cd service/
pnpm build
cd ..

rm -rf YiAiQuickDeploy/dist/* YiAiQuickDeploy/public/* YiAiQuickDeploy/templates/*

mkdir -p YiAiQuickDeploy/dist YiAiQuickDeploy/public/admin YiAiQuickDeploy/templates

cp service/pm2.conf.json YiAiQuickDeploy/pm2.conf.json
cp service/package.json YiAiQuickDeploy/package.json
cp service/README.md YiAiQuickDeploy/README.md
cp service/.env.example YiAiQuickDeploy/.env.example

cp -r service/templates/* YiAiQuickDeploy/templates
cp -r service/dist/* YiAiQuickDeploy/dist
cp -r admin/dist/* YiAiQuickDeploy/public/admin
cp -r chat/dist/* YiAiQuickDeploy/public

echo "打包完成"