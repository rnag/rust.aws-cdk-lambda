import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as crypto from 'crypto';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { Settings } from '.';
import { BaseBuildProps, build } from './build';
import { LAMBDA_TARGETS } from './settings';
import {
    createDirectory,
    getPackageName,
    lambdaArchitecture,
    logTime,
} from './utils';

/**
 * Properties for a RustFunction
 */
export interface RustFunctionProps
    extends lambda.FunctionOptions,
        BaseBuildProps {
    /**
     * Path to directory with Cargo.toml
     *
     * @default - Directory from where cdk binary is invoked
     */
    readonly directory?: string;

    /**
     * The build directory
     *
     * @default - `.build` in the entry file directory
     */
    readonly buildDir?: string;

    /**
     * The cache directory
     *
     * Parcel uses a filesystem cache for fast rebuilds.
     *
     * @default - `.cache` in the root directory
     */
    readonly cacheDir?: string;

    /**
     * Determines whether we want to set up library logging - i.e. set the
     * `RUST_LOG` environment variable - for the lambda function.
     */
    readonly setupLogging?: boolean;
}

/**
 * A Rust Lambda function built using `cargo-zigbuild`
 */
export class RustFunction extends lambda.Function {
    constructor(
        scope: Construct,
        id: string,
        props: RustFunctionProps
    ) {
        const entry = props.directory || Settings.ENTRY;
        const handler = 'does.not.matter';
        const target =
            <LAMBDA_TARGETS>props.target || Settings.TARGET;
        const arch = props.architecture || lambdaArchitecture(target);
        const buildDir = props.buildDir || Settings.BUILD_DIR;

        let executable: string;
        let binName: string | undefined;
        if (props.package) {
            binName = undefined;
            executable = props.package;
        } else {
            binName = props.bin || getPackageName(entry);
            executable = binName;
        }

        const handlerDir = path.join(
            buildDir,
            // We need to generate a *unique* hash in case there are multiple
            // executables, so use the `binName` here instead.
            crypto
                .createHash('sha256')
                .update(executable)
                .digest('hex')
        );
        createDirectory(buildDir);
        createDirectory(handlerDir);

        let start = performance.now();

        // Build with `cargo-zigbuild`
        build({
            ...props,
            entry,
            bin: binName,
            target: target,
            outDir: handlerDir,
        });

        logTime(start, `🎯  Cross-compile \`${executable}\``);

        let lambdaEnv = props.environment;
        // Sets up logging if needed.
        //   Ref: https://rust-lang-nursery.github.io/rust-cookbook/development_tools/debugging/config_log.html
        if (props.setupLogging) {
            lambdaEnv = lambdaEnv || {};
            // Need to use the *underscore*- separated variant, which is
            // coincidentally how Rust imports are done.
            let underscoredName = executable.split('-').join('_');
            // Set the `RUST_LOG` environment variable.
            lambdaEnv.RUST_LOG = `${Settings.DEFAULT_LOG_LEVEL},${underscoredName}=${Settings.MODULE_LOG_LEVEL}`;
        }

        super(scope, id, {
            ...props,
            runtime: Settings.RUNTIME,
            architecture: arch,
            code: lambda.Code.fromAsset(handlerDir),
            handler: handler,
            environment: lambdaEnv,
        });
    }
}
