# Rollbar deploy lambda

Notify rollbar about a new deployment on Elastic Beanstalk

## Installation
 
    npm install
    
Ceate an [IAM role](https://console.aws.amazon.com/iam) with the following policy:

    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                  "Action": [
                      "logs:CreateLogGroup",
                      "logs:CreateLogStream",
                      "logs:PutLogEvents"
                  ],
                  "Resource": "arn:aws:logs:*:*:*"
            },
            {
                "Action": [
                    "elasticbeanstalk:DescribeEnvironments"
                ],
                "Effect": "Allow",
                "Resource": [
                    "*"
                ]
            }
        ]
    }

Setup node-lambda and edit the generated `.env` file:

    node_modules/.bin/node-lambda setup
    editor .env

## Configuration

    cp config.example.json
    editor config.json
    
Use your Elastic Beanstalk application name as key and enter a Rollbar Project
Access token with write privileges.

The `environment` field can be a single Rollbar environment (string) or an
object mapping Elastic Beanstalk environments to Rollbar environments.

Note that you can use the same lambda for multiple applications by mutiple
application sections to the configuration.

Note that if an application is not in the configuration or an environment isn't
mapped, the Lambda will result in a failure, which has no consequences when
triggered by SNS. 

## Usage

    node_modules/.bin/node-lambda run
    
## Test

    npm test
    
## Deployment

    node_modules/.bin/node-lambda deploy

