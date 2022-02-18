#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { RustStandaloneStack } from '../lib/rust-standalone-stack';

const app = new cdk.App();
new RustStandaloneStack(app, 'RustStandaloneStack');
