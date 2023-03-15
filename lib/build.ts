import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import * as os from 'os';
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
     * The target to use `cargo lambda` to compile to.
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
     * build` or `cargo lambda`.
     *
     * Use environment variables to apply configuration changes, such
     * as test and production environment configurations, without changing your
     * Lambda function source code.
     *
     * @default - No environment variables.
     */
    readonly buildEnvironment?: { [key:string]: string };

    /**
     * Additional arguments that are passed in at build time to `cargo lambda`.
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

    /**
     * Target platform.
     */
    readonly targetPlatform: NodeJS.Platform;
}

/**
 * Creates a command to build with `cargo lambda`.
 *
 * @remarks
 *
 * Execute a returned command with `bash` on Linux/macOS, or `cmd` on Win32.
 */
export function createBuildCommand(options: BuildOptions): string {
    // reference: https://github.com/aws/aws-cdk/blob/1ca3e0027323e84aacade4d9bd058bbc5687a7ab/packages/%40aws-cdk/aws-lambda-go/lib/bundling.ts#L228-L237
    const pathJoin = (...paths: string[]) => {
        const joined: string = path.join(...paths);
        // if we are on win32 but need posix style paths
        if (os.platform() === 'win32' && options.targetPlatform !== 'win32') {
            return joined.replace(/\\/g, '/');
        }
        return joined;
    };

    let outputName: string;
    let extra_args: string[] | undefined;

    // Build binary
    if (options.bin) {
        outputName = options.bin!;
        if (Settings.BUILD_INDIVIDUALLY) {
            extra_args = ['--bin', outputName];
        } else {
            extra_args = ['--bins'];
        }
    }
    // Build package - i.e. workspace member
    else {
        outputName = options.package!;
        if (Settings.BUILD_INDIVIDUALLY) {
            extra_args = ['--package', outputName];
        } else {
            extra_args = ['--workspace'];
        }
    }
    // Base arguments for `cargo lambda`
    const buildArgs = ['--quiet', '--color', 'always'];

    let extraBuildArgs = options.extraBuildArgs || Settings.EXTRA_BUILD_ARGS;
    let features = options.features || Settings.FEATURES;

    if (extraBuildArgs) {
        buildArgs.push(...extraBuildArgs);
    }
    if (features) {
        buildArgs.push('--features', features.join(','));
    }

    // constructs build commands
    // - runs `cargo lambda`
    const buildDir = pathJoin(options.outDir, '.build');
    const cargoCommand: string = [
        'cargo',
        'lambda',
        'build',
        '--lambda-dir',
        buildDir,
        '--release',
        '--target',
        options.target,
        ...buildArgs,
        ...extra_args!,
    ].join(' ');

    // - moves artifact: outDir/.build/<outputName>/bootstrap → outDir/bootstrap
    const artifactDir = pathJoin(buildDir, outputName);
    const moveCommand: string = [
        options.targetPlatform === 'win32' ? 'move' : 'mv',
        pathJoin(artifactDir, 'bootstrap'),
        pathJoin(options.outDir, 'bootstrap'),
    ].join(' ');

    // - cleans up the build directory
    const cleanupCommand: string = options.targetPlatform === 'win32'
        ? ['rmdir', '/s', '/q', buildDir].join(' ')
        : ['rm', '-rf', buildDir].join(' ');

    return chain([
        cargoCommand,
        moveCommand,
        cleanupCommand,
    ]);
}

// reference: https://github.com/aws/aws-cdk/blob/1ca3e0027323e84aacade4d9bd058bbc5687a7ab/packages/%40aws-cdk/aws-lambda-go/lib/bundling.ts#L239-L241
function chain(commands: string[]): string {
    return commands.join(' && ');
}

/**
 * Build with `cargo lambda`
 */
export function build(options: BuildOptions): void {
    try {
        let outputName: string;
        let shouldCompile: boolean;
        let extra_args: string[] | undefined;

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
            const releaseDirExists = existsSync(options.outDir);

            // Base arguments for `cargo lambda`

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
                // target. This is most likely an initial run, so `cargo lambda`
                // will take much longer than usual to cross-compile the code.
                //
                // Print out an informative message that the `build` step is
                // expected to take longer than usual.
                console.log(
                    `🍺  Building Rust code with \`cargo lambda\`. This may take a few minutes...`
                );
            }

            const args: string[] = [
                'lambda',
                'build',
                '--lambda-dir',
                options.outDir,
                '--release',
                '--target',
                options.target,
                ...buildArgs,
                ...extra_args!,
            ];

            const cargo = spawnSync('cargo', args, {
                cwd: options.entry,
                env: buildEnv,
            });

            if (cargo.status !== 0) {
                console.error(cargo.stderr.toString().trim());
                console.error(`💥  Run \`cargo lambda\` errored.`);
                process.exit(1);
                // Note: I don't want to raise an error here, as that will clutter the
                // output with the stack trace here. But maybe, there's a way to
                // suppress that?
                // throw new Error(cargo.stderr.toString().trim());
            }
        }
    } catch (err) {
        throw new Error(
            `Failed to build file at ${options.entry}: ${err}`
        );
    }
}
