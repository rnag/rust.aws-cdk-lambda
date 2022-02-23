import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { Settings } from '.';
import { logTime } from './utils';

let _builtWorkspaces = false,
    _builtBinaries = false,
    _ranCargoCheck = false;

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
     * The target to use `cross` to compile to.
     *
     * Normally you'll need to first add the target to your toolchain:
     *    $ rustup target add <target>
     *
     * The target defaults to `x86_64-unknown-linux-musl` if not passed.
     */
    readonly target?: string;
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
 * Build with Cross
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

        let targetReleaseDir = path.join(
            options.entry,
            'target',
            options.target,
            'release'
        );
        const releaseDirExists = fs.existsSync(targetReleaseDir);

        if (shouldCompile) {
            // Run `cargo check` on an initial time, if needed
            if (Settings.RUN_CARGO_CHECK && !_ranCargoCheck) {
                _ranCargoCheck = true;
                checkCode(options, releaseDirExists);
            }

            if (releaseDirExists) {
                console.log(`🍺  Building Rust code...`);
            } else {
                // The `release` directory doesn't exist for the specified
                // target. This is most likely an initial run, so `cross` will
                // take much longer than usual to cross-compile the code.
                //
                // Print out an informative message that the `build` step is
                // expected to take longer than usual.
                console.log(
                    `🍺  Building Rust code with \`cross\`. This may take a few minutes...`
                );
            }

            const args: string[] = [
                'build',
                '--release',
                '--target',
                options.target,
                ...extra_args!,
            ];

            const cross = spawnSync('cross', args, {
                cwd: options.entry,
            });

            if (cross.error) {
                throw cross.error;
            }

            if (cross.status !== 0) {
                throw new Error(cross.stderr.toString().trim());
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

/**
 * Validate code with `cargo check`
 *
 * Note: this step is optional, and can be disabled with
 * `Settings.RUN_CARGO_CHECK` as needed.
 */
export function checkCode(
    options: BuildOptions,
    releaseDirExists: boolean
) {
    if (!releaseDirExists) {
        // The `release` directory doesn't exist for the specified
        // target. This is most likely an initial run, so `cargo` will
        // take much longer than usual to check the code.
        //
        // Print out an informative message that the `validate` step is
        // expected to take longer than usual.
        console.log(
            `🧪  Checking code with \`cargo\`. This may take a few minutes...`
        );
    }

    let start = performance.now();

    const args: string[] = [
        'check',
        '--release',
        '--target',
        options.target,
        '--color',
        'always',
    ];

    const check = spawnSync('cargo', args, {
        cwd: options.entry,
    });

    if (check.error) {
        throw check.error;
    }

    if (check.status !== 0) {
        console.error(check.stderr.toString().trim());
        console.error(`💥  Run \`cargo check\` errored.`);
        process.exit(1);
        // Note: I don't want to raise an error here, as that will clutter the
        // output with the stack trace here. But maybe, there's a way to
        // suppress that?
        // throw new Error(check.stderr.toString().trim());
    }

    logTime(start, `✅  Run \`cargo check\``);
}
