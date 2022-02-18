import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

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
    TARGET: 'x86_64-unknown-linux-musl',
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
    set workspace_dir(folder: string) {
        this.ENTRY = path.join(this.ENTRY, folder);
    },
};
