#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { RustWorkspacesStack } from '../lib/rust-workspaces-stack';

const app = new cdk.App();
new RustWorkspacesStack(app, 'RustWorkspacesStack');
