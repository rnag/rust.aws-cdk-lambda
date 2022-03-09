import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Settings } from '.';

let _builtWorkspaces = false,
    _builtBinaries = false;

export interface BaseBuildProps {
    /**
     * Executable name to pass to `--bin`
     */
    readonly bin?: string;

    /**
     * Workspace package name to pass to `--package`
     */
    readonly package?: string;

    /**
     * The target to use `cargo-zigbuild` to compile to.
     *
     * Normally you'll need to first add the target to your toolchain:
     *    $ rustup target add <target>
     *
     * The target defaults to `aarch64-unknown-linux-gnu` if not passed.
     */
    readonly target?: string;

    /**
     * A list of features to activate when compiling Rust code.
     */
    readonly features?: string[];

    /**
     * Key-value pairs that are passed in at compile time, i.e. to `cargo
     * build` or `cargo zig-build`.
     *
     * Use environment variables to apply configuration changes, such
     * as test and production environment configurations, without changing your
     * Lambda function source code.
     *
     * @default - No environment variables.
     */
    readonly buildEnvironment?: NodeJS.ProcessEnv;

    /**
     * Additional arguments that are passed in at build time to `cargo-zigbuild`.
     *
     * ## Examples
     *
     * - `--all-features`
     * - `--no-default-features`
     */
    readonly extraBuildArgs?: string[];
}

/**
 * Build options
 */
export interface BuildOptions extends BaseBuildProps {
    /**
     * Entry file
     */
    readonly entry: string;

    /**
     * The output directory
     */
    readonly outDir: string;

    // Makes this property *required*
    readonly target: string;
}

/**
 * Build with `cargo-zigbuild zigbuild`
 */
export function build(options: BuildOptions): void {
    try {
        let outputName: string;
        let shouldCompile: boolean;
        let extra_args: string[] | undefined;

        let targetReleaseDir = path.join(
            options.entry,
            'target',
            options.target,
            'release'
        );

        // Build binary
        if (options.bin) {
            outputName = options.bin!;
            if (_builtBinaries) {
                shouldCompile = false;
                extra_args = undefined;
            } else if (Settings.BUILD_INDIVIDUALLY) {
                shouldCompile = true;
                extra_args = ['--bin', outputName];
            } else {
                _builtBinaries = true;
                shouldCompile = true;
                extra_args = ['--bins'];
            }
        }

        // Build package - i.e. workspace member
        else {
            outputName = options.package!;
            if (_builtWorkspaces) {
                shouldCompile = false;
                extra_args = undefined;
            } else if (Settings.BUILD_INDIVIDUALLY) {
                shouldCompile = true;
                extra_args = ['--package', outputName];
            } else {
                _builtWorkspaces = true;
                shouldCompile = true;
                extra_args = ['--workspace'];
            }
        }

        if (shouldCompile) {
            // Check if directory `./target/{{target}}/release` exists
            const releaseDirExists = fs.existsSync(targetReleaseDir);

            // Base arguments for `cargo-zigbuild`

            const buildArgs = ['--quiet', '--color', 'always'];

            let extraBuildArgs =
                options.extraBuildArgs || Settings.EXTRA_BUILD_ARGS;
            let features = options.features || Settings.FEATURES;

            if (extraBuildArgs) {
                buildArgs.push(...extraBuildArgs);
            }
            if (features) {
                buildArgs.push('--features', features.join(','));
            }

            // Set process environment (optional)
            let inputEnv =
                options.buildEnvironment ||
                Settings.BUILD_ENVIRONMENT;
            const buildEnv = inputEnv
                ? {
                      ...process.env,
                      ...inputEnv,
                  }
                : undefined;

            if (releaseDirExists) {
                console.log(`🍺  Building Rust code...`);
            } else {
                // The `release` directory doesn't exist for the specified
                // target. This is most likely an initial run, so `cargo-zigbuild`
                // will take much longer than usual to cross-compile the code.
                //
                // Print out an informative message that the `build` step is
                // expected to take longer than usual.
                console.log(
                    `🍺  Building Rust code with \`cargo-zigbuild\`. This may take a few minutes...`
                );
            }

            const args: string[] = [
                'zigbuild',
                '--release',
                '--target',
                options.target,
                ...buildArgs,
                ...extra_args!,
            ];

            const zigBuild = spawnSync('cargo-zigbuild', args, {
                cwd: options.entry,
                env: buildEnv,
            });

            if (zigBuild.status !== 0) {
                console.error(zigBuild.stderr.toString().trim());
                console.error(`💥  Run \`cargo zigbuild\` errored.`);
                process.exit(1);
                // Note: I don't want to raise an error here, as that will clutter the
                // output with the stack trace here. But maybe, there's a way to
                // suppress that?
                // throw new Error(zigBuild.stderr.toString().trim());
            }
        }

        let from = path.join(targetReleaseDir, outputName);
        let to = path.join(options.outDir, 'bootstrap');

        fs.copyFileSync(from, to);
    } catch (err) {
        throw new Error(
            `Failed to build file at ${options.entry}: ${err}`
        );
    }
}
