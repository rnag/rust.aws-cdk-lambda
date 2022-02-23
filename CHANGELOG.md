# Changelog

This project follows semantic versioning.

Possible header types:

-   `Features` for any new features added, or for backwards-compatible
    changes to existing functionality.
-   `Bug Fixes` for any bug fixes.
-   `Breaking Changes` for any backwards-incompatible changes.

## [Unreleased]

## v0.3.0 (2022-02-23)

### Features

-   Add support to run `cargo check` by default before building Rust code.
-   Clean up console log messages that get printed out so they are a bit nicer.
-   Change the value that is set for the `RUST_LOG` environment variable when `setupLogging` is enabled.
    -   The format is now `warn,module_name=default` instead of `module_name=trace`.
-   Add below global _Settings_:
    -   `RUN_CARGO_CHECK`
    -   `DEFAULT_LOG_LEVEL`
    -   `MODULE_LOG_LEVEL`

## v0.2.0 (2022-02-19)

### Features

-   Add docs on _Rust Function Properties_ and _Settings_.
-   Add new Rust Function Properties such as `setupLogging`.
-   Update Readme docs.
-   Add `cdk-examples/`.
-   Reduce overall package size when publishing to `npm`.
-   Some other stuff that I don't remember.

## v0.1.0 (2022-02-17)

-   Initial Release on [npmjs.com] :tada:

[npmjs.com]: https://www.npmjs.com/package/rust.aws-cdk-lambda
