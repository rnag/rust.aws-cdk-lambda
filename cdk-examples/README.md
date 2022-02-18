# CDK Examples

Contains sample CDK apps

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
cargo init --vcs git
```

Add following lines to the `.gitignore`:

```
# Rust lambda build directory
.build
```
