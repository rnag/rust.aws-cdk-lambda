#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { RustBinsStack } from '../lib/rust-bins-stack';

const app = new cdk.App();
new RustBinsStack(app, 'RustBinsStack');
