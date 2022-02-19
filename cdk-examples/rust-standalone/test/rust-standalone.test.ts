import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as RustStandalone from '../lib/rust-standalone-stack';

test('S3 Bucket Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new RustStandalone.RustStandaloneStack(
        app,
        'MyTestStack'
    );
    // THEN

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
        },
    });

    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::Lambda::Function', 1);
});
