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
