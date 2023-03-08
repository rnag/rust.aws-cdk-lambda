import * as cdk from 'aws-cdk-lib';
import { AssetHashType, DockerRunOptions } from 'aws-cdk-lib';
import {
    Architecture,
    AssetCode,
    Code,
    Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Settings } from '.';
import { createBuildCommand } from './build';

/**
 * Options for bundling
 */
export interface BundlingProps extends DockerRunOptions {
    /**
     * Determines how the asset hash is calculated.
     *
     * @remarks
     *
     * This property is set to `AssetHashType.SOURCE` to prevent the costly Rust
     * compiler from running when there is no change in the source files.
     *
     * If your asset depends on files outside `entity`, you have to specify
     * a type other than `AssetHashType.SOURCE`.
     *
     * @default - {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.AssetHashType.html#source | AssetHashType.SOURCE}
     */
    readonly assetHashType?: AssetHashType;

    /**
     * Custom asset hash.
     *
     * @remarks
     *
     * This property is meaningful if and only if `assetHashType` is
     * `AssetHashType.CUSTOM`.
     */
    readonly assetHash?: string;

    /**
     * Path to the directory that contains the project to be built; i.e., the
     * directory containing `Cargo.toml`.
     */
    readonly entry: string;

    /**
     * Executable name.
     */
    readonly bin?: string;

    /**
     * The runtime of the lambda function
     */
    readonly runtime: Runtime;

    /**
     * The system architecture of the lambda function
     */
    readonly architecture: Architecture;

    /**
     * Target of `cargo build`.
     */
    readonly target: string;

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
    readonly buildEnvironment?: NodeJS.ProcessEnv;
}

/**
 * Bundling
 */
export class Bundling implements cdk.BundlingOptions {
    public static bundle(options: BundlingProps): AssetCode {
        const bundling = new Bundling(options);

        return Code.fromAsset(options.entry, {
            assetHashType: options.assetHashType ?? cdk.AssetHashType.SOURCE,
            assetHash: options.assetHash,
            bundling: {
                image: bundling.image,
                local: bundling.local,
            },
        });
    }

    // Core bundling options
    public readonly image: cdk.DockerImage;
    public readonly local?: cdk.ILocalBundling;

    constructor(private readonly props: BundlingProps) {
        // Local bundling

        this.image = cdk.DockerImage.fromRegistry('dummy'); // Do not build if we don't need to

        const osPlatform = os.platform();
        this.local = {
            // reference: https://github.com/aws/aws-cdk/blob/1ca3e0027323e84aacade4d9bd058bbc5687a7ab/packages/%40aws-cdk/aws-lambda-go/lib/bundling.ts#L174-L199
            tryBundle(outDir: string) {
                console.log(`BUNDLING...: ${outDir}`);
                const buildCommand = createBuildCommand({
                    entry: props.entry,
                    bin: props.bin,
                    target: props.target,
                    outDir,
                    targetPlatform: osPlatform,
                });
                const inputEnv =
                    props.buildEnvironment ||
                    Settings.BUILD_ENVIRONMENT;
                console.log('Running:', buildCommand);
                const cargo = spawnSync(
                    osPlatform === 'win32' ? 'cmd' : 'bash',
                    [
                        osPlatform === 'win32' ? '/c' : '-c',
                        buildCommand,
                    ],
                    {
                        env: { ...process.env, ...inputEnv ?? {} },
                        cwd: props.entry,
                        windowsVerbatimArguments: osPlatform === 'win32',
                    },
                );
                if (cargo.status !== 0) {
                    console.error(cargo.stderr.toString().trim());
                    console.error(`💥  Run \`cargo lambda\` errored.`);
                    process.exit(1);
                }
                return true;
            },
        };
    }
}
