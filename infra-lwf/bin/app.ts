import { App } from 'aws-cdk-lib';
import { BenchLwfStack } from '../lib/bench-stack';

const app = new App();
new BenchLwfStack(app, 'BenchLwf', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-1' },
});
