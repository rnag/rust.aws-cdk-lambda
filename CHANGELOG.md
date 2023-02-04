# Changelog

This project follows semantic versioning.

Possible header types:

-   `Features` for any new features added, or for backwards-compatible
    changes to existing functionality.
-   `Bug Fixes` for any bug fixes.
-   `Breaking Changes` for any backwards-incompatible changes.

## [Unreleased]

## v1.2.0 (2023-02-03)

### Bug Fixes

-   `RustFunction` should not execute `cargo lambda` when certain `cdk` sub-commands are invoked, such as:
    -   `destroy`
    -   `list`
    -   etc.
-   _Potential_ bug-fix (unconfirmed): The library should not execute `cargo lambda` when a project has multiple stacks, and the stack being deployed doesn't include any `RustFunction` constructs.

### Features

-   Add parameters to `Settings`:
    -   `SKIP_BUILD`
-   Update docs to mention how to _skip_ the build step by passing in the `build` context flag when invoking a `cdk` command. For example:
    ```shell
    cdk synth -c build=0
    ```
-   Update developer docs used for local testing, as I determined a newish approach with `npm link` can be used, as outlined in [this article].
-   Enable `swc` in all sample CDK apps, in order to improve the overall [performance of `ts-node`](https://typestrong.org/ts-node/docs/performance) when `cdk` is run.

[this article]: https://stackoverflow.com/a/18778516/10237506

## v1.1.3 (2022-03-28)

### Breaking Changes

-   Switch to use [`cargo-lambda`] -- which abstracts away `cargo-zigbuild` -- for
    building Rust code; technically this is not a _breaking_ change, but it **will** require
    the package to be installed with `cargo`.

[`cargo-lambda`]: https://crates.io/crates/cargo-lambda

### Features

-   [zig] can now be installed via the `--save-optional` flag when installing this package:
    ```shell
    npm i rust.aws-cdk-lambda --save-optional
    ```
-   The size of the _release_ binaries deployed to AWS Lambda should now be smaller, since `cargo-lambda` passes the [`-C strip`] argument as `symbols`.
-   Remove existing logic to copy over binaries to the _build_ directory, as this should now be handled by `cargo-lambda` instead.

[zig]: https://ziglang.org/
[`-c strip`]: https://doc.rust-lang.org/stable/rustc/codegen-options/index.html#strip

## v1.0.0 (2022-03-21)

### Breaking Changes

-   Switch to use [`cargo-zigbuild`] -- instead of `cross` -- for building Rust code.
-   Switch the default build architecture from `x86_64` to `arm64`; this package now uses **aarch64-unknown-linux-gnu** as the default build target for AWS Lambda functions, mainly as I've found this architecture to be slightly more performant in general use cases.
-   Do not run `cargo check`, as it appears _cargo-zigbuild_ automatically runs this check.
-   Update `cdk-examples/` with an example of how to conditionally run a code block (more than one statement) when a feature is enabled.

[`cargo-zigbuild`]: https://github.com/messense/cargo-zigbuild

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
