# VS-Puku

This is a simple VSCode wrapper around [Puku](https://github.com/please-build/puku) that runs puku each time a `go` file is saved.

## Features

Will run puku (a helper for writing plz BUILD files) on save.

## Requirements

- [Puku](https://github.com/please-build/puku)
- [Please](https://github.com/thought-machine/please)

## Extension Settings

This extension contributes the following settings:

- `vs-puku.runOnSave`: enable/disable this extension
- `vs-puku.autoClearConsole`: clears the "output" console before each run
- `vs-puku.pukuCommand`: command to trigger `puku` (you won't need to change this if you are using the puku tool directly)
- `vs-puku.shell`: shell to execute the command with, probably don't bother changing this.

## Known Issues

1. I haven't bothered implementing the tests yet.
2. Might not work on windows due to \ paths? Let me know if it does not.

## Release Notes

### 0.0.1

Initial release of vs-puku, will run `${puku} fmt ${path}` on save and atm that's all I need to stay tuned for potential updates...
