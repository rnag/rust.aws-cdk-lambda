import * as cdk from 'aws-cdk-lib';
import { DockerRunOptions } from 'aws-cdk-lib';
import {
    Architecture,
    AssetCode,
    Code,
    Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { dirname } from 'path';

/**
 * Options for bundling
 */
export interface BundlingProps extends DockerRunOptions {
    /**
     * CDK output (staging) directory for the lambda function
     */
    readonly handlerDir: string;

    /**
     * The runtime of the lambda function
     */
    readonly runtime: Runtime;

    /**
     * The system architecture of the lambda function
     */
    readonly architecture: Architecture;
}

/**
 * Bundling
 */
export class Bundling implements cdk.BundlingOptions {
    public static bundle(options: BundlingProps): AssetCode {
        const bundling = new Bundling(options);

        return Code.fromAsset(dirname(options.handlerDir), {
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
            tryBundle(outputDir: string) {
                // TODO
                console.log(`BUNDLING...: ${outputDir}`);

                return true;
            },
        };
    }
}
