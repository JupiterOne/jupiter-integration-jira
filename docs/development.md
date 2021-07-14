# Development

## Prerequisites

This integration uses a wrapper for Jira API maintained
[here](https://github.com/jira-node/node-jira-client).

## Provider account setup

You can get a free account on
[Jira's website](https://www.atlassian.com/software/jira/free).

## Authentication

The first version of the integration used a simple host/username/password
authentication method. However, Jira supports OAuth, and we should change to it
at some point. For more, see [Jira and OAuth]
(https://developer.atlassian.com/server/jira/platform/jira-rest-api-example-oauth-authentication-6291692/)

It looks like the Jira client wrapper for the REST API that we are using already
supports OAuth. From the client constructor: options.oauth = { consumer_key:
options.oauth.consumer_key, consumer_secret: options.oauth.consumer_secret,
token: options.oauth.access_token, token_secret:
options.oauth.access_token_secret, signature_method:
options.oauth.signature_method || 'RSA-SHA1' };

If we passed this oauth object instead of the username and password params, it
should use the OAuth flow. However, this would require migrating existing
customers to OAuth, or writing code that checks the customer config and
configures which authen to use.
