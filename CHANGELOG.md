# Changelog

This project follows semantic versioning.

Possible header types:

-   `Features` for any new features added, or for backwards-compatible
    changes to existing functionality.
-   `Bug Fixes` for any bug fixes.
-   `Breaking Changes` for any backwards-incompatible changes.

## [Unreleased]

## v0.4.0 (2022-03-08)

### Features

-   Rename `Settings` parameter `workspace_dir` -> `WORKSPACE_DIR`.
-   Add support for Rust [features] and compile-time [environment variables].
-   Add parameters to `Settings`:
    -   `FEATURES`
    -   `BUILD_ENVIRONMENT`
    -   `EXTRA_BUILD_ARGS`
-   Add parameters to `RustFunctionProps`:
    -   `features`
    -   `buildEnvironment`
    -   `extraBuildArgs`

[features]: https://doc.rust-lang.org/cargo/reference/features.html
[environment variables]: https://doc.rust-lang.org/cargo/reference/environment-variables.html#environment-variables-cargo-sets-for-crates

### Breaking Changes

-   Updated default target from `x86_64-unknown-linux-musl` -> `x86_64-unknown-linux-gnu`; technically this is not a _breaking_ change, but it will require the target to be added via `rustup`.

### Bug Fixes

-   Ensure that the Lambda architecture is correctly set based on the `target` to cross-compile to.
-   Do not pass `--target` when running `cargo check`, as this can result in errors in some cases.

## v0.3.0 (2022-02-23)

### Features

-   Add support to run `cargo check` by default before building Rust code.
-   Clean up console log messages that get printed out so they are a bit nicer.
-   Change the value that is set for the `RUST_LOG` environment variable when `setupLogging` is enabled.
    -   The format is now `warn,module_name=debug` instead of `module_name=trace`.
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
