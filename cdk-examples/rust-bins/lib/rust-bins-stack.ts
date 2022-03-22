import { Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { RustFunction, Settings } from 'rust.aws-cdk-lambda';
// uncomment for local testing
// import { RustFunction, Settings } from '../../../lib';

export class RustBinsStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Enable optional features and env variables at build (compile) time.
        Settings.FEATURES = [
            'my-dev-feature',
            // uncomment to see how the lambda output changes!
            // 'my-prod-feature'
        ];
        Settings.BUILD_ENVIRONMENT = {
            LEARN_RUST_URL: 'https://doc.rust-lang.org',
        };

        // Uncomment if you want to build (e.g. cross-compile) each target, or
        // binary, individually.
        // Settings.BUILD_INDIVIDUALLY = true;

        // Uncomment to cross-compile Rust code to a different Lambda architecture.
        // Settings.TARGET = 'x86_64-unknown-linux-gnu';

        const bucket = new s3.Bucket(this, 'RustBinsBucket', {
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            publicReadAccess: false,
        });

        let myLambda1 = new RustFunction(this, 'MyRustLambda1', {
            bin: 'my_lambda1',
            // Useful so library logs show up in CloudWatch
            setupLogging: true,
            environment: {
                BUCKET_NAME: bucket.bucketName,
            },
        });

        // Grant bucket read-write permissions to the first lambda
        bucket.grantReadWrite(myLambda1);

        let _myLambda2 = new RustFunction(this, 'MyRustLambda2', {
            bin: 'my_lambda2',
            setupLogging: true,
        });
    }
}
