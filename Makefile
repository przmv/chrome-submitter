SRCS = src/css/*.css src/js/*.js src/*.html src/*.png

all: submitter.crx

submitter.crx: src/manifest.json
	@echo Building extension...
	@crxmake.sh src *.pem
	@mv src.crx $@

src/manifest.json: VERSION
	@echo Updating manifest.json...
	@sed 's/%VERSION%/'$(shell cat VERSION)'/' src/manifest.json.in > src/manifest.json

VERSION: $(SRCS)
	@echo Increasing version...
	@sed -i 's/^.*$$/'$(shell bump < VERSION)'/' VERSION

clean:
	@echo Cleaning...
	@rm -rf src/manifest.json
	@rm -rf submitter.crx

PHONY: all clean