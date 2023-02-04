import { Architecture } from 'aws-cdk-lib/aws-lambda';
import {
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
} from 'fs';
import { join } from 'path';
import { performance } from 'perf_hooks';
import * as toml from 'toml';
import { LAMBDA_TARGETS } from './settings';

const truthyValues = ['T', 'TRUE', 'OK', 'ON', '1', 'Y', 'YES'];

/**
 * Base layout of a `Cargo.toml` file in a Rust project
 *
 * Note: This is only used when `RustFunctionProps.bin` is not defined.
 */
export interface CargoTomlProps {
    readonly package: {
        name: string;
    };
}

export function asBool(value: any, defaultValue: string = 'T') {
    return truthyValues.includes(
        (value ?? defaultValue).toUpperCase()
    );
}

export function logTime(start: number, message: string) {
    const elapsedSec = ((performance.now() - start) / 1000).toFixed(
        6
    );
    console.log(`${message}: ${elapsedSec}s`);
}

export function ensureDirExists(dir: string, recursive = true) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive });
}

export function createFile(filePath: string, data: string) {
    if (!existsSync(filePath)) {
        writeFileSync(filePath, data);
    }
}

export function getPackageName(entry: string) {
    const tomlFilePath = join(entry, 'Cargo.toml');
    // console.trace(`Parsing TOML file at ${tomlFilePath}`);

    try {
        const contents = readFileSync(tomlFilePath, 'utf8');
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

export function lambdaArchitecture(
    target: LAMBDA_TARGETS
): Architecture {
    return target.startsWith('x86_64')
        ? Architecture.X86_64
        : Architecture.ARM_64;
}
