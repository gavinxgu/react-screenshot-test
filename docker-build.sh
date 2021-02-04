VERSION=$(node -e "console.log(require(\"./package.json\").version)")
IMAGE_TAG=gavinxgu/react-screenshot-test:$VERSION
docker build -t $IMAGE_TAG .
docker push $IMAGE_TAG
