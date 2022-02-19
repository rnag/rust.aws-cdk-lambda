# Welcome to your CDK TypeScript project!

A CDK app which demonstrates a sample project with multiple Rust binaries, each deployed as an AWS Lambda function.

This stack sets up an S3 bucket with permissions locked down by default, and an AWS Lambda Function which saves the request (input) as a text file in the bucket.

The second AWS Lambda function instead opts to make a series of GET and POST requests using the `reqwests` library. It also uses `anyhow` to simplify error handling scenarios.

The Lambdas requires an input with a `command` key, such as the following example:

```json
{
    "command": "Do something!"
}
```

---

You should explore the contents of this project. It demonstrates a CDK app with an instance of a stack (`RustBinsStack`)
which contains an Amazon SQS queue that is subscribed to an Amazon SNS topic.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

-   `npm run build` compile typescript to js
-   `npm run watch` watch for changes and compile
-   `npm run test` perform the jest unit tests
-   `cdk deploy` deploy this stack to your default AWS account/region
-   `cdk diff` compare deployed stack with current state
-   `cdk synth` emits the synthesized CloudFormation template
