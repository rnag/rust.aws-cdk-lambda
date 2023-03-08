import * as cdk from 'aws-cdk-lib';
import { DockerRunOptions } from 'aws-cdk-lib';
import {
    Architecture,
    AssetCode,
    Code,
    Runtime,
} from 'aws-cdk-lib/aws-lambda';
import * as fs from 'fs';
import * as path from 'path';
import { build } from './build';

/**
 * Options for bundling
 */
export interface BundlingProps extends DockerRunOptions {
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
}

/**
 * Bundling
 */
export class Bundling implements cdk.BundlingOptions {
    public static bundle(options: BundlingProps): AssetCode {
        const bundling = new Bundling(options);

        return Code.fromAsset(options.entry, {
            assetHashType: cdk.AssetHashType.OUTPUT,
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

        this.local = {
            tryBundle(outDir: string) {
                console.log(`BUNDLING...: ${outDir}`);
                build({
                    entry: props.entry,
                    bin: props.bin,
                    target: props.target,
                    outDir,
                });
                // moves <bin>/bootstrap → ./bootstrap
                // and cleans up the empty folder
                const binDir = path.join(outDir, props.bin!);
                fs.renameSync(
                  path.join(binDir, 'bootstrap'),
                  path.join(outDir, 'bootstrap')
                );
                fs.rmdirSync(binDir);

                return true;
            },
        };
    }
}
