# CDK Examples

Contains sample CDK apps that use Rust Lambda Functions.

## Deploy

First, ensure that your AWS profile - which points to the AWS account you want to deploy the CDK app to - is properly set up:

```shell
export AWS_PROFILE='my-profile'
```

After that, `cd` into one of the sample CDK directories, and install all node dependencies:

```shell
cd my-app
npm i
```

Next, ensure that you have [`cargo-lambda`](https://crates.io/crates/cargo-lambda) installed. You will need this to cross-compile Rust code for deployment via `cdk`.
If you don't have `cargo-lambda` installed, refer to the [Getting Started](https://github.com/rnag/rust.aws-cdk-lambda#getting-started) section in docs for more info on getting set up.

Now you can deploy the app with `cdk`:

> Note: on an initial run, it may take a _really_ long time on the compilation step with `cargo-lambda`. In my case, it sometimes took up to _12 minutes_! But don't worry, any subsequent deployments should be overall faster.

```shell
npx cdk deploy
```

## Creating a New App

Create a new folder:

```shell
mkdir my-app
cd my-app
```

Run `cdk init`:

```shell
cdk init sample-app --language=typescript
```

Run `cargo init`:

```shell
cargo init --vcs git && rm -rf .git
```

Add following lines to the generated `.gitignore`:

```
# Rust lambda build directory
.build
```

For example, using:

```shell
echo '\n# Rust lambda build directory\n.build' >> .gitignore
```

## Local Development and Testing

> _Note_: See the [New Approach](#new-approach) below which obviates the need to update the `import` statements.

In case it's desirable to uncomment the following import in the `lib/` folder of a sample CDK app, for local testing purposes:

```ts
import { RustFunction, Settings } from '../../../lib';
```

You may then potentially run into some import errors when deploying the stack via `cdk`.

To fix that, run this command from both the project root folder `$root`, and compare the output when running it from within `$root/cdk-examples/my-app`:

```shell
npm list
```

To resolve the import issues, you'll need to ensure that certain package versions are the same between the two directories.

For example, here are the important ones you'd need to verify:

```plaintext
├── aws-cdk-lib@2.12.0
├── aws-cdk@2.12.0
├── constructs@10.0.65
```

### New Approach

As per [this article](https://stackoverflow.com/a/18778516/10237506) I found that explains how a local module can be installed with `npm link`, this is a slightly different approach to commenting out and then un-commenting an `import` statement as mentioned above.

This does also have a few unavoidable side-effects, but hopefully such a method should yield an overall better (developer) experience.

Here then, is the updated approach which leverages `npm link` under the hood to locally install an NPM module.

First, `cd` into the local directory of a sample CDK app.

Within this folder, run the npm script `link` (alias: `l`) to automatically link to the local `rust.aws-cdk-lambda` module -- i.e. the project folder two levels up:

```shell
npm run l
```

If all is well, you should see that the _linking_ is successful.

To confirm:

```shell
npm list
```

The result should be something like:

```plaintext
...
├── rust.aws-cdk-lambda@1.2.0 -> ./../..
...
```

That means everything is set up correctly! CDK code should reference the definitions under `../../dist/`, i.e. under the root folder.

Next -- open a new terminal window, and from the project root folder `$root`, run the following command:

```shell
npm run watch
```

This will listen for any changes to the project TypeScript code, and automatically run `tsc` to down-compile it to JS code, which it places in the `dist/` folder.

These changes will also be reflected in the sample CDK project, thanks to `npm link` which was run earlier.

To _unlink_ the local module and use the remote one installed as a dependency listed in the `package.json`, simply run the following from the root of a sample CDK app:

```shell
npm run ul
```
