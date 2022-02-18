import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { RustFunction } from '../../../lib';

export class RustStandaloneStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const bucket = new s3.Bucket(this, 'RustStandaloneBucket', {
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            publicReadAccess: false,
        });

        let myLambda = new RustFunction(this, 'MyRustLambda', {
            functionName: 'my-standalone-rust-lambda',
            memorySize: 128,
            // Increase the max timeout slightly
            timeout: Duration.seconds(10),
            environment: {
                BUCKET_NAME: bucket.bucketName,
            },
            // Useful so library logs show up in CloudWatch
            setupLogging: true,
        });

        bucket.grantReadWrite(myLambda);
    }
}
