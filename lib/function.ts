import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import * as toml from 'toml';
import { Settings } from '.';
import { BaseBuildProps, build } from './build';

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
}

/**
 * Base layout of a `Cargo.toml` file in a Rust project
 *
 * Note: This is only used when `RustFunctionProps.bin` is not defined
 * from above.
 */
export interface CargoTomlProps {
    readonly package: {
        name: string;
    };
}

/**
 * A Rust Lambda function built using cross
 */
export class RustFunction extends lambda.Function {
    constructor(
        scope: Construct,
        id: string,
        props: RustFunctionProps
    ) {
        const entry = props.directory || Settings.ENTRY;
        const handler = 'does.not.matter';
        const target = props.target || Settings.TARGET;
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

        // Build with Parcel
        build({
            entry,
            bin: binName,
            package: props.package,
            target: target,
            outDir: handlerDir,
        });

        logTime(start, `🎯  Cross-compile \`${executable}\``);

        super(scope, id, {
            ...props,
            runtime: Settings.RUNTIME,
            code: lambda.Code.fromAsset(handlerDir),
            handler: handler,
        });
    }
}

function createDirectory(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

function logTime(start: number, message: string) {
    const elapsedSec = ((performance.now() - start) / 1000).toFixed(
        2
    );
    console.log(`${message}: ${elapsedSec}s`);
}

function getPackageName(entry: string) {
    const tomlFilePath = path.join(entry, 'Cargo.toml');
    // console.trace(`Parsing TOML file at ${tomlFilePath}`);

    try {
        const contents = fs.readFileSync(tomlFilePath, 'utf8');
        let data: CargoTomlProps = toml.parse(contents);
        return data.package.name;
    } catch (err) {
        throw new Error(
            `Unable to parse package name from \`${tomlFilePath}\`\n` +
                `  ${err}\n` +
                `  Resolution: Pass the executable as the \`bin\` parameter, ` +
                `or as \`package\` for a workspace.`
        );
    }
}
