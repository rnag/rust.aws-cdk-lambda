# Amazon Lambda Rust Library

<!--BEGIN STABILITY BANNER-->

---

![rust.aws-cdk-lambda: Stable](https://img.shields.io/badge/rust.aws--cdk--lambda-stable-success.svg?style=for-the-badge)
[![npm](https://img.shields.io/npm/v/rust.aws-cdk-lambda?style=for-the-badge)](https://www.npmjs.com/package/rust.aws-cdk-lambda)

> **This is an unofficial CDK library based on the [Amazon Lambda Node.js] and [aws-lambda-rust] Libraries.**
>
> _It's intended for use with the new **[AWS CDK v2]**_.

[aws cdk v2]: https://aws.amazon.com/about-aws/whats-new/2021/12/aws-cloud-development-kit-cdk-generally-available/
[amazon lambda node.js]: https://www.npmjs.com/package/@aws-cdk/aws-lambda-nodejs
[aws-lambda-rust]: https://www.npmjs.com/package/aws-lambda-rust

---

<!--END STABILITY BANNER-->

This library provides a construct for a Rust Lambda function.

It uses [Docker] and [`cross`] under the hood, and follows best practices as outlined
in the [official AWS documentation].

[docker]: https://www.docker.com/get-started
[`cross`]: https://github.com/rust-embedded/cross
[official aws documentation]: https://docs.aws.amazon.com/sdk-for-rust/latest/dg/lambda.html

## Rust Function

The `RustFunction` construct creates a Lambda function with automatic bundling and compilation of Rust code.

## Getting Started

1. Install the [npm](https://nodejs.org/) package:

    ```shell
    $ npm i rust.aws-cdk-lambda
    ```

2) Use [`cargo`] to install _rust-embedded/cross_:

    ```shell
    $ cargo install cross
    ```

3. Install the **aarch64-unknown-linux-gnu** toolchain with Rustup by running:

    ```shell
    $ rustup target add aarch64-unknown-linux-gnu
    ```

Finally, ensure you have [Docker] installed and running, as it will be used by `cross` to compile Rust code for deployment.

[`cargo`]: https://www.rust-lang.org/

## Examples

You can find sample CDK apps built using _Typescript_ or _Node.js_ in the [cdk-examples/] folder of the GitHub project repo.

[cdk-examples/]: https://github.com/rnag/rust.aws-cdk-lambda/tree/main/cdk-examples

## Usage

First, import the construct:

```ts
import { RustFunction } from 'rust.aws-cdk-lambda';
```

Now define a `RustFunction`:

```ts
new RustFunction(this, 'my-handler', {});
```

By default, the construct will use directory where `cdk` was invoked as directory where Cargo files are located.

If no `bin` or `package` argument is passed in, it will default to the package name as defined in the main `Cargo.toml`.

That is, the above usage should work for a project structure that looks like this:

```plaintext
.
├── Cargo.toml
└── src
    └── main.rs
```

Alternatively, `directory` and `bin` can be specified:

```ts
new RustFunction(this, 'MyLambdaFunction', {
    directory: '/path/to/directory/with/Cargo.toml',
    // Optional
    bin: 'my_lambda',
});
```

All other properties of `lambda.Function` are supported, see also the [AWS Lambda construct library](https://github.com/aws/aws-cdk/tree/master/packages/%40aws-cdk/aws-lambda).

## How It Works

When bundling the code, the `RustFunction` runs the following steps in order:

-   First it runs `cargo check` to confirm that the Rust code can compile.
    Note that this is an optional step, and [can be disabled](#settings) as mentioned below.

-   Next it calls `cross build`, and passes in the `--release` and `--target` flags, so it compiles for a Lambda environment - which defaults to the **aarch64-unknown-linux-gnu** target, as mentioned above.

-   Finally, it copies the release app binary from the `target/` folder to a file named `bootstrap`, which the Lambda custom runtime environment looks for. It adds this new file under the _build directory_, which defaults to a `.build/` folder under the directory where `cdk` was invoked.

-   The directory path to the executable is then passed in to `lambda.Code.fromAsset`, which creates a _zip file_ from the release binary asset.

## Multiple Rust Lambdas

Assuming you have a CDK project with more than one Rust
lambda, there are a couple approaches - as outlined below -
that you can use to deploy with `cdk`.

### Multiple Binaries

Suppose your project layout looks like this:

```plaintext
.
├── Cargo.toml
└── src
    └── bin
        ├── lambda1.rs
        └── lambda2.rs
```

Here's one way to deploy that via `cdk`:

```ts
new RustFunction(this, 'my-function-1', {
    bin: 'lambda1',
});

new RustFunction(this, 'my-function-2', {
    bin: 'lambda2',
});
```

You can find a more complete project structure in the [rust-bins/] CDK sample project.

[rust-bins/]: https://github.com/rnag/rust.aws-cdk-lambda/tree/main/cdk-examples/rust-bins

### Multiple Packages

Suppose you use [Workspaces] in your Cargo project instead.

The full contents of the main `Cargo.toml` would need to be updated
to look like this:

```toml
[workspace]
members = [
    "lambda1",
    "lambda2"
]
```

And your new project layout would now look similar to this:

```plaintext
.
├── Cargo.lock
├── Cargo.toml
├── lambda1
│   ├── Cargo.toml
│   └── src
│       ├── main.rs
│       └── utils.rs
└── lambda2
    ├── Cargo.toml
    └── src
        ├── main.rs
        └── utils.rs
```

Where the `utils.rs` files are optional, but the point is that they can be imported by the lambda handler code in `main.rs` if desired.

Now you will only need to update your CDK code to pass `package` instead,
for each workspace member:

```ts
new RustFunction(this, 'MyFirstRustFunction', {
    package: 'lambda1',
});

new RustFunction(this, 'MySecondRustFunction', {
    package: 'lambda2',
});
```

You can find a more complete project structure in the [rust-workspaces/] CDK sample project.

[workspaces]: https://doc.rust-lang.org/book/ch14-03-cargo-workspaces.html
[rust-workspaces/]: https://github.com/rnag/rust.aws-cdk-lambda/tree/main/cdk-examples/rust-workspaces

## Conditional Compilation

A common use case is building Rust code with enabled [features], and compile-
time environment variables that can be used with the [`env!`] macro.

For example, we might want to run different logic in our code for _development_ and _production_ environments, or call a different API endpoint depending on which environment we are deploying code to.

For a sample CDK app that demonstrate such usage, check out the [rust-bins/] example.

### Enabling Features

You can achieve conditional compilation by [introducing features](https://stackoverflow.com/a/27634313/10237506) which can later be enabled in Rust code.

In the `Cargo.toml`, create a new `features` section:

```toml
[features]
my-feature = [] # feature has no explicit dependencies
```

In your code, add the line `#[cfg(feature="my-feature")]` before a function declaration, or before a statement to execute.

In your CDK code in the `lib/` folder, add the following line:

```ts
// Enable features at compile or build time.
Settings.FEATURES = ['my-feature'];
```

### Build Environment Variables

You can also introduce environment variables which are resolved at build or compile time. These values can be used in code via the [`env!`] macro in Rust.

In your code, add a call to the `env!()` macro:

```rust
// Retrieve an environment variable set at build (compile) time.
let build_value = env!("MY_BUILD_VAR");
```

In your CDK code in the `lib/` folder, add the following line:

```ts
// Enable environment variables at compile or build time.
Settings.BUILD_ENVIRONMENT = {
    MY_BUILD_VAR: 'Hello World! Testing 123.',
};
```

[features]: https://doc.rust-lang.org/cargo/reference/features.html
[`env!`]: https://doc.rust-lang.org/std/macro.env.html

## Rust Function Properties

Below lists some commonly used properties you can pass in to the `RustFunction` construct.

| Name               | Description                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target`           | Build target to cross-compile to. Defaults to the target for the **arm64** architecture, `aarch64-unknown-linux-gnu`.                                                                                                                                                                                                                                                                           |
| `directory`        | Entry point where the project's main `Cargo.toml` is located. By default, the construct will use directory where `cdk` was invoked as the directory where Cargo files are located.                                                                                                                                                                                                              |
| `buildDir`         | Default Build directory, which defaults to a `.build` folder under the project's root directory.                                                                                                                                                                                                                                                                                                |
| `bin`              | Executable name to pass to `--bin`                                                                                                                                                                                                                                                                                                                                                              |
| `package`          | Workspace package name to pass to `--package`                                                                                                                                                                                                                                                                                                                                                   |
| `setupLogging`     | Determines whether we want to set up [library logging](https://rust-lang-nursery.github.io/rust-cookbook/development_tools/debugging/config_log.html) - i.e. set the `RUST_LOG` environment variable - for the lambda function.<br><br>The format defaults to `warn,module_name=debug`, which means that the default log level is `warn`, and the executable or library's log level is `debug`. |
|                    |
| `features`         | A list of features to activate when compiling Rust code. These must also be added to the `Cargo.toml` file.                                                                                                                                                                                                                                                                                     |
| `buildEnvironment` | Key-value pairs that are passed in at compile time, i.e. to `cargo build` or `cross build`. This differs from `environment`, which determines the environment variables which are set on the AWS Lambda function itself.                                                                                                                                                                        |
| `extraBuildArgs`   | Additional arguments that are passed in at build time to both `cargo check` and `cross build`. For example, [`--all-features`].                                                                                                                                                                                                                                                                 |

## Settings

Settings can be imported as follows:

```ts
import { Settings } from 'rust.aws-cdk-lambda';
```

Below are some useful _global_ defaults which can be set for all Rust Lambda Functions in a CDK app.

| Name                 | Description                                                                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BUILD_INDIVIDUALLY` | Whether to build each executable individually, either via `--bin` or `--package`.                                                                                                                                                           |
| `RUN_CARGO_CHECK`    | Whether to run `cargo check` to validate Rust code before building it with `cross`. Defaults to _true_.                                                                                                                                     |
| `DEFAULT_LOG_LEVEL`  | Log Level for non-module libraries. Note that this value is only used when `RustFunctionProps.setupLogging` is enabled. Defaults to `warn`.                                                                                                 |
| `MODULE_LOG_LEVEL`   | Log Level for a module (i.e. the executable). Note that this value is only used when `RustFunctionProps.setupLogging` is enabled. Defaults to `debug`.                                                                                      |
| `WORKSPACE_DIR`      | Sets the root workspace directory. By default, the workspace directory is assumed to be the directory where `cdk` was invoked.<br><br>This directory should contain at the minimum a `Cargo.toml` file which defines the workspace members. |
| `FEATURES`           | A list of features to activate when compiling Rust code. These must also be added to the `Cargo.toml` file.                                                                                                                                 |
| `BUILD_ENVIRONMENT`  | Key-value pairs that are passed in at compile time, i.e. to `cargo build` or `cross build`. This differs from `environment`, which determines the environment variables which are set on the AWS Lambda function itself.                    |
| `EXTRA_BUILD_ARGS`   | Additional arguments that are passed in at build time to both `cargo check` and `cross build`. For example, [`--all-features`].                                                                                                             |
