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

        if (shouldCompile) {
            console.log(
                `🍺  Building Rust code with \`cross\`. This may take a few minutes...`
            );
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

        let from = path.join(
            options.entry,
            'target',
            options.target,
            'release',
            outputName
        );
        let to = path.join(options.outDir, 'bootstrap');

        fs.copyFileSync(from, to);
    } catch (err) {
        throw new Error(
            `Failed to build file at ${options.entry}: ${err}`
        );
    }
}
