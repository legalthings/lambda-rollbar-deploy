var request = require('request');
const URL = "https://api.rollbar.com/api/1/deploy/";
var AWS = require('aws-sdk');
var async = require('async');
var eb = new AWS.ElasticBeanstalk();
var config = require("./config.json");

exports.handler = function(event, context){
  'use strict';

  // Parse the Message part from the event
  var notification = parseEvent(event.Records[0].Sns);
  
  // Get the configuration for this application
  if (typeof config[notification.Application] === 'undefined') {
      context.fail(notification.Application + " not configured");
      return;
  }
  
  var settings = config[notification.Application];
  if (
    typeof settings.environment === 'object' &&
    typeof settings.environment[notification.Environment] === 'undefined'
  ) {
    context.fail("Rollbar environment for " + notification.Environment  + " not configured");
    return;
  }

  // Add the Environment to the Rollbar deploy message
  var rollbar = {};
  rollbar.access_token = settings.rollbar_access_token;
  rollbar.environment = typeof settings.environment === 'object'
    ? settings.environment[notification.Environment]
    : settings.environment;
  rollbar.local_username = 'Elastic Beanstalk';
  
  // Load the revision from Elastic Beanstalk
  loadRevision(notification.Application, notification.Environment, function(err, revision){
    if (err) return context.fail(err);

    // Set the revision in the Rollbar deploy message
    rollbar.revision = revision;
    
    // Send the deploy message to Rollbar
    sendRollbarDeploy(rollbar, function(err, result){
      if (err) return context.fail(err);

      if (result.err) {
        context.fail("Rollbar API call: " + result.message);
      }

      context.succeed([
        "Successfully sent deploy to Rollbar.",
        "Application: " + notification.Application,
        "Environment: " + rollbar.environment,
        "Revision: " + rollbar.revision
      ].join(" | "));
    })
  });
};

/**
 * Parse the received event by reading the Message field and generate javascript object from it
 * @param event The received sns event
 * @returns the parsed notification
 */
function parseEvent(event) {
  var notification = {};
  var messageLines = event.Message.split("\n");
  async.each(messageLines, function (line) {
    var messageItem = line.split(": ");
    if (messageItem[0] && messageItem[0] != '') {
      notification[messageItem[0]] = messageItem[1].trim();
    }
  });

  return notification;
}

/**
 * Read the revision of the deployed version of the elastic beanstalk environment
 *
 * @param applicationName Name of the EB application
 * @param environmentName Name of the EB environment
 * @param callback Revision hash
 */
var loadRevision = function(applicationName, environmentName, callback) {
  var params = {
    ApplicationName: applicationName, 
    EnvironmentNames: [environmentName],
    IncludeDeleted: false
  };
  
  eb.describeEnvironments(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      return callback(err);
    }

    // get the last version to extract the commit hash
    var environment = data.Environments[0];
    if (!environment) {
      return callback("Failed to find environment " + environmentName + " in application " + applicationName + " on Elastic Beanstalk");
    }
    
    var revision = environment.VersionLabel;
    callback(null, revision);
  });
}

/**
 * Send the deploy message to rollback
 * @param notification Notification containing all the deploy information
 * @param callback Result from the rollbar api call
 */
function sendRollbarDeploy(notification, callback) {
  request.post({
    url: 'https://api.rollbar.com/api/1/deploy/',
    form: notification
  }, function (err, httpResponse, body) {
    if (err) return callback(err, null);

    callback(null, JSON.parse(body));
  });
}

