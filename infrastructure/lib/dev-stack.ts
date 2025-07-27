import { MindsyncBaseStack, MindsyncStackProps } from './base-stack';
import { Construct } from 'constructs';

export class MindsyncDevStack extends MindsyncBaseStack {
  constructor(scope: Construct, id: string, props: MindsyncStackProps) {
    super(scope, id, props);
  }
}
