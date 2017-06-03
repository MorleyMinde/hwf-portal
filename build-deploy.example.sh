ng build --aot --prod
cp dist/assets/manifest.webapp dist
cd dist
zip -r -D waterpointv2.zip .
curl -X POST -u rajabumkomwa:MKOMWA2017 -F file=@waterpointv2.zip https://waterpoint.tk/api/apps
