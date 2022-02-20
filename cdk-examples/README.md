# CDK Examples

Contains sample CDK apps

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

Next, ensure that you have [Docker](https://www.docker.com/get-started) running. You will need this to deploy with [`cross`](https://github.com/cross-rs/cross).
If you don't have `cross` installed, refer to the [Getting Started](https://github.com/rnag/rust.aws-cdk-lambda#getting-started) section in docs for more info on getting set up.

Now you can deploy the app with `cdk`:

> Note: on an initial run, it may take a _really_ long time on the compilation step with `cross`. In my case, it sometimes took up to _12 minutes_! But don't worry, any subsequent deployments should be overall faster.

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
