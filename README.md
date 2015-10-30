# Rollbar deploy lambda

Notify rollbar about a new deployment on Elastic Beanstalk

## Installation
 
    npm install
    
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

