import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'path';
import { performance } from 'perf_hooks';
import { Settings } from '.';
import { BaseBuildProps } from './build';
import { Bundling } from './bundling';
import {
    Code,
    Function,
    FunctionOptions,
} from 'aws-cdk-lib/aws-lambda';
import { LAMBDA_TARGETS } from './settings';
import {
    asBool,
    ensureDirExists,
    getPackageName,
    lambdaArchitecture,
    logTime,
} from './utils';

/**
 * Properties for a RustFunction
 */
export interface RustFunctionProps
    extends FunctionOptions,
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
     * @deprecated build directory is no longer used because the CDK prepares
     * one for bundling.
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

    /**
     * Forces bundling in a Docker container even if local bundling is possible.
     *
     * @default - false
     */
    readonly forcedDockerBundling?: boolean;
}

/**
 * A Rust Lambda function built using `cargo lambda`
 */
export class RustFunction extends Function {
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

        let executable: string;
        let binName: string | undefined;
        if (props.package) {
            binName = undefined;
            executable = props.package;
        } else {
            binName = props.bin || getPackageName(entry);
            executable = binName;
        }

        // Check if we really need to build with `cargo-lambda`.

        // In certain cases, such as calling `cdk destroy`
        // or `cdk list`, the compile step should not run.
        const thisStack = Stack.of(scope);
        const shouldBuild = thisStack.bundlingRequired;

        // Check if `build` context value is passed in
        // to command-line. For example:
        //     $ cdk deploy -c build=no
        if (Settings.SKIP_BUILD === undefined)
            Settings.SKIP_BUILD = !asBool(
                scope.node.tryGetContext('build'),
                'T'
            );

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
            code: Bundling.bundle({
                entry,
                bin: binName,
                runtime: Settings.RUNTIME,
                architecture: arch,
                target,
                buildEnvironment: props.buildEnvironment,
                forcedDockerBundling: props.forcedDockerBundling,
            }),
            handler: handler,
            environment: lambdaEnv,
        });
    }
}
