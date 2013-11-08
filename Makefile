test:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter spec \
		--harmony-generators

.PHONY: test