docker_server_debug:
	docker run -it --rm -v $(shell pwd):/app --net host mcr.microsoft.com/playwright:bionic /usr/bin/yarn --cwd /app start:screenshot:server:local
test_debug:
	DEBUG=1 yarn test
release:
	git diff-index --quiet HEAD
	git fetch --all --tags
	npm publish --access public
	bash docker-build.sh