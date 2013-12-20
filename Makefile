test:
	@./node_modules/.bin/mocha \
		--harmony \
		--require should \
		--reporter spec \
		--bail

.PHONY: test