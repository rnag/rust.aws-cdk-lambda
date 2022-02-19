import { Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { RustFunction, Settings } from '../../../lib';

export class RustWorkspacesStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Set the base Cargo workspace directory
        Settings.workspace_dir = 'my_lambdas';

        // Uncomment if you want to build (e.g. cross-compile) each target, or
        // workspace member, individually.
        // Settings.BUILD_INDIVIDUALLY = true;

        const bucket = new s3.Bucket(this, 'RustWorkspacesBucket', {
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            publicReadAccess: false,
        });

        let myLambda1 = new RustFunction(this, 'MyRustLambda1', {
            package: 'my_lambda1',
            // Useful so library logs show up in CloudWatch
            setupLogging: true,
            environment: {
                BUCKET_NAME: bucket.bucketName,
            },
        });

        // Grant bucket read-write permissions to the first lambda
        bucket.grantReadWrite(myLambda1);

        let _myLambda2 = new RustFunction(this, 'MyRustLambda2', {
            package: 'my_lambda2',
            setupLogging: true,
        });
    }
}