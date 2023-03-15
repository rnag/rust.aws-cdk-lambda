import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { cwd } from 'process';

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
    ENTRY: cwd(),

    /**
     * Default Build directory, which defaults to a `.build` folder under the
     * project's root directory.
     */
    BUILD_DIR: join(cwd(), '.build'),

    /**
     * Build target to cross-compile to. Defaults to the target for Amazon
     * Linux 2, as recommended in the [official AWS documentation].
     *
     * [official AWS documentation]: https://docs.aws.amazon.com/sdk-for-rust/latest/dg/lambda.html
     */
    TARGET: 'aarch64-unknown-linux-gnu' as LAMBDA_TARGETS,

    /**
     * Custom Lambda Runtime, running on `Amazon Linux 2`
     */
    RUNTIME: Runtime.PROVIDED_AL2,

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
     * build` or `cargo lambda`.
     *
     * Use environment variables to apply configuration changes, such
     * as test and production environment configurations, without changing your
     * Lambda function source code.
     *
     * @default - No environment variables.
     */
    BUILD_ENVIRONMENT: undefined as { [key:string]: string } | undefined,

    /**
     * Additional arguments that are passed in at build time to `cargo lambda`.
     *
     * ## Examples
     *
     * - `--all-features`
     * - `--no-default-features`
     */
    EXTRA_BUILD_ARGS: undefined as string[] | undefined,

    /**
     * Whether to skip building Rust Lambdas -- e.g. skip
     * the compile step with `cargo lambda`.
     *
     * Alternatively, this can be set in the `build`
     * context, when invoking `cdk` -- for example:
     *
     *   ```console
     *   cdk deploy -c build=[T | true | 1 | Y | yes | ok | on]
     *   ```
     */
    SKIP_BUILD: undefined as boolean | undefined,

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
        this.ENTRY = join(this.ENTRY, folder);
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
