import { CfnOutput, Stack, type StackProps } from 'aws-cdk-lib';
import { WebFunction, WebFunctionCode } from 'cdk-lambda-web';
import { Construct } from 'constructs';
import * as path from 'node:path';

const DIST = path.join(__dirname, '../../dist-lwf');
const APPS = ['sveltekit', 'tanstack', 'next', 'next-cc', 'next-cached'];

export class BenchLwfStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Bundles start from lwf-entry.mjs, which maps AWS_LAMBDA_HTTP_ENDPOINT to HOST/PORT.
    const bench = (name: string, environment?: Record<string, string>) => {
      const fn = new WebFunction(this, name, {
        functionName: `bench-${name}`,
        code: WebFunctionCode.fromAsset(path.join(DIST, name)),
        entrypoint: 'lwf-entry.mjs',
        environment,
      });
      new CfnOutput(this, `${name}-url`, { value: fn.url });
      return fn;
    };

    const dataApi = bench('data-api');
    for (const app of APPS) bench(app, { DATA_API_URL: dataApi.url });
  }
}
