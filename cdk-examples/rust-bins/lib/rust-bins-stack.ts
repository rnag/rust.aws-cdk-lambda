import { Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { RustFunction, Settings } from '../../../lib';

export class RustBinsStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Uncomment if you want to build (e.g. cross-compile) each target, or
        // binary, individually.
        // Settings.BUILD_INDIVIDUALLY = true;

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
