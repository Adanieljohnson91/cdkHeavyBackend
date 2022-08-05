// import { Duration, Stack, StackProps } from 'aws-cdk-lib';
// import * as sns from 'aws-cdk-lib/aws-sns';
// import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
// import { Construct } from 'constructs';

// export class HeavyBackendCalculationLambdaStack extends Stack {
//   constructor(scope: Construct, id: string, props?: StackProps) {
//     super(scope, id, props);

//     const queue = new sqs.Queue(this, 'HeavyBackendCalculationLambdaQueue', {
//       visibilityTimeout: Duration.seconds(300)
//     });

//     const topic = new sns.Topic(this, 'HeavyBackendCalculationLambdaTopic');

//     topic.addSubscription(new subs.SqsSubscription(queue));
//   }
// }
/**
 * Lambda Function Starter
 */
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as destinations from 'aws-cdk-lib/aws-lambda-destinations';
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { Duration } from "aws-cdk-lib";

/**
 * Infrustructure stack: \
 * DDB Table: CalculationHashTable \
 * DeadLetterQueue \
 * HeavyBackendEventQueue to take incoming requests from a server \
 * Lambda handles request from HeavyBackendEventQueue
 * 
 * TODO: 
 * - Refine Durations and Message Handling to account for larger payloads \
 * - Create EC2 to host routing server
 * - Create EC2 and S3 for client side code hosting.
 * - Implement SAMS tests
 */
export class HeavyBackendCalculationLambdaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //DDB Tables
    const userTable = new ddb.Table(this, 'CalclationHashTable', {
      
      tableName: "CalclationHashTable",
      partitionKey: { name: 'Hex', type: ddb.AttributeType.STRING },
      
    })

    userTable.addGlobalSecondaryIndex({
      partitionKey: {name: "Hex", type: ddb.AttributeType.STRING},
      indexName: "JobStatus",
      projectionType: ddb.ProjectionType.ALL

    })
    
    // SQS
    const queue = new sqs.Queue(this, "HeavyBackendQueue", {
      queueName: "HeavyBackendEventQueue",
      visibilityTimeout: Duration.minutes(15) // TODO test for max span of cal to config.
    })

    const deadLetterQueue = new sqs.Queue(this, "HeavyBackendDeadLetterQueue")
    
    //Lambda Function Calculation Handler
    const calcFunction = new lambda.Function(this, 'HeavyBackendCalculationLambda', {
      code: lambda.Code.fromAsset("./lambda/build"),
      functionName: "heavyBackendCalculation",
      handler: "index.handler",
      memorySize: 1024,
      runtime: lambda.Runtime.NODEJS_16_X,
      timeout: cdk.Duration.minutes(15),
      onFailure: new destinations.SqsDestination(deadLetterQueue),
      retryAttempts: 0
    })

    // TODO: reduce access of role. granting ReadWriteData did not grant expected access. needs investigation.
    calcFunction.role?.attachInlinePolicy(
      new iam.Policy(this, 'access-ddb-tables', {
        statements: [new iam.PolicyStatement({
          actions: ['dynamodb:*'],
          resources: [userTable.tableArn]
        })]
      })
    )

    // Allow Lambda to send message to queue
    queue.grantSendMessages(calcFunction);

    // Allow Lambda access to read and write to DB
    userTable.grantReadData(calcFunction);
    userTable.grantReadWriteData(calcFunction);

    // Add Triggering to CalcLambda Function
    const eventSource = new lambdaEventSources.SqsEventSource(queue, {
      batchSize: 2,
      maxBatchingWindow: Duration.seconds(30)
    });

    calcFunction.addEventSource(eventSource);
  }
}