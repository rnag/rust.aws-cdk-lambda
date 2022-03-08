import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

// These are the valid cross-compile targets for AWS Lambda.
//
// See also: <https://github.com/awslabs/aws-lambda-rust-runtime/discussions/306#discussioncomment-485478>.
export type LAMBDA_TARGETS =
    // For Arm64 Lambda functions
    | 'aarch64-unknown-linux-gnu'
    // For x86_64 Lambda functions
    | 'x86_64-unknown-linux-gnu'
    | 'x86_64-unknown-linux-musl';

/**
 * Contains common settings and default values.
 */
export const Settings = {
    /**
     * Entry point where the project's main `Cargo.toml` is located. By
     * default, the construct will use directory where `cdk` was invoked as
     * the directory where Cargo files are located.
     */
    ENTRY: process.cwd(),

    /**
     * Default Build directory, which defaults to a `.build` folder under the
     * project's root directory.
     */
    BUILD_DIR: path.join(process.cwd(), '.build'),

    /**
     * Build target to cross-compile to. Defaults to the target for Amazon
     * Linux 2, as recommended in the [official AWS documentation].
     *
     * [official AWS documentation]: https://docs.aws.amazon.com/sdk-for-rust/latest/dg/lambda.html
     */
    TARGET: 'x86_64-unknown-linux-musl' as LAMBDA_TARGETS,

    /**
     * Custom Lambda Runtime, running on `Amazon Linux 2`
     */
    RUNTIME: lambda.Runtime.PROVIDED_AL2,

    /**
     * Whether to build each executable individually, either via `--bin` or
     * `--package`.
     *
     * If not specified, the default behavior is to build all executables at
     * once, via `--bins` or `--workspace`, as generally this is the more
     * efficient approach.
     */
    BUILD_INDIVIDUALLY: false,

    /**
     * Whether to run `cargo check` to validate Rust code before building it with `cross`.
     *
     * Defaults to true.
     */
    RUN_CARGO_CHECK: true,

    /**
     * Default Log Level, for non-module libraries.
     *
     * Note: this value is only used when `RustFunctionProps.setupLogging`
     * is enabled.
     */
    DEFAULT_LOG_LEVEL: 'warn',

    /**
     * Default Log Level for a module (i.e. the executable)
     *
     * Note: this value is only used when `RustFunctionProps.setupLogging`
     * is enabled.
     */
    MODULE_LOG_LEVEL: 'debug',

    /**
     * A list of features to activate when compiling Rust code.
     *
     * @default - No enabled features.
     */
    FEATURES: undefined as string[] | undefined,

    /**
     * Key-value pairs that are passed in at compile time, i.e. to `cargo
     * build` or `cross build`.
     *
     * Use environment variables to apply configuration changes, such
     * as test and production environment configurations, without changing your
     * Lambda function source code.
     *
     * @default - No environment variables.
     */
    BUILD_ENVIRONMENT: undefined as NodeJS.ProcessEnv | undefined,

    /**
     * Additional arguments that are passed in at build time to both
     * `cargo check` and `cross build`.
     *
     * ## Examples
     *
     * - `--all-features`
     * - `--no-default-features`
     */
    EXTRA_BUILD_ARGS: undefined as string[] | undefined,

    /**
     * Sets the root workspace directory. By default, the workspace directory
     * is assumed to be the directory where `cdk` was invoked.
     *
     * This directory should contain at the minimum a `Cargo.toml` file which
     * defines the workspace members. Sample contents of this file are shown:
     *
     *   ```toml
     *   [workspace]
     *   members = ["lambda1", "lambda2"]
     *   ```
     *
     */
    set WORKSPACE_DIR(folder: string) {
        this.ENTRY = path.join(this.ENTRY, folder);
    },

    /**
     * Sets the root workspace directory. By default, the workspace directory
     * is assumed to be the directory where `cdk` was invoked.
     *
     * This directory should contain at the minimum a `Cargo.toml` file which
     * defines the workspace members. Sample contents of this file are shown:
     *
     *   ```toml
     *   [workspace]
     *   members = ["lambda1", "lambda2"]
     *
     * @deprecated Use `WORKSPACE_DIR()` instead. This will be removed
     * in v1.0.
     */
    set workspace_dir(folder: string) {
        this.WORKSPACE_DIR = folder;
    },
};
