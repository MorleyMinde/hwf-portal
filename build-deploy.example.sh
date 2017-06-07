ng build  --prod
cp dist/assets/manifest.webapp dist
cd dist
zip -r -D waterpointv2.zip .
