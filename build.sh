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

rm -rf AIWebQuickDeploy/dist/* AIWebQuickDeploy/public/* AIWebQuickDeploy/templates/*

mkdir -p AIWebQuickDeploy/dist AIWebQuickDeploy/public/admin AIWebQuickDeploy/templates

cp service/pm2.conf.json AIWebQuickDeploy/pm2.conf.json
cp service/package.json AIWebQuickDeploy/package.json
cp service/README.md AIWebQuickDeploy/README.md
cp service/.env.example AIWebQuickDeploy/.env.example
cp service/Dockerfile AIWebQuickDeploy/Dockerfile
cp service/docker-compose.yml AIWebQuickDeploy/docker-compose.yml

cp -r service/templates/* AIWebQuickDeploy/templates
cp -r service/dist/* AIWebQuickDeploy/dist
cp -r admin/dist/* AIWebQuickDeploy/public/admin
cp -r chat/dist/* AIWebQuickDeploy/public

echo "打包完成"
