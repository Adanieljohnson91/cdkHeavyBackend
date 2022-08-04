# HeavyBackend
## Overview
 HeavyBackend is a playenvironment for experimenting with AWS CDK Infrustructure, AWS Services, and Handling Big Numbers.

## Packages
- client \
Client package contains a front end ui which contains a form and button. \
This is an interface to begin triggering of our system
- HeavyBackendServer \
Server to handle post request and a get request that is used for long polling ddb
- HeavyBackendCalculationLambdaCDK  \
contains lib folder that holds our CDK Stack, and our lambda function in /lambda. \

## Start up instructions
Note you will need to have AWS CDK globally installed on your machine. Resources should be uniquely set to your account outside of SQS endpoints that are hardcoded.

## Testing
Jest is configured throughout the applications, currently no tests are in place.
SAMS testing will be required for AWS CDK