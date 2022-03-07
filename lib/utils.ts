import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import * as toml from 'toml';

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

export function logTime(start: number, message: string) {
    const elapsedSec = ((performance.now() - start) / 1000).toFixed(
        2
    );
    console.log(`${message}: ${elapsedSec}s`);
}

export function createDirectory(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

export function createFile(filePath: string, data: string) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, data);
    }
}

export function deleteFile(filePath: string, force = true) {
    if (fs.existsSync(filePath)) {
        // @ts-ignore: TS2339
        fs.rmSync(filePath, {
            force: force,
        });
    }
}

export function getPackageName(entry: string) {
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
