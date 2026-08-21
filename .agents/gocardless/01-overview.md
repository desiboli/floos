# Overview

Source: https://docs.gocardless.com/docs/bank-account-data

# Overview

## Account Information API Documentation

## Introduction

This document explains how to integrate with Bank Account Data API to connect to your users' bank accounts and access account information from bank PSD2 APIs. Bank Account Data API is a set of endpoints that allows you to integrate our Account Information solution with your system. All responses will be shown in JSON format. All endpoints require the Authorization token.

Before you start, please make sure you have acquired a user secret from GoCardless's [**Bank Account Data portal**](https://bankaccountdata.gocardless.com/login/)

To jump-start your integration, head straight to the [Quickstart Guide](/docs/bank-account-data/quickstart-guide).

## Available data

Account Information solution can access up to 24 months of transaction history as well as up to 90 days of continuous access to account information.

Our Account Information solution provides access to the following data:

- [**Account**](/docs/bank-account-data/output-account-details)**: account holder name, a list of account holder's accounts (account number, IBAN)**
- [**Transactions**](/docs/bank-account-data/output-transaction-details)**: date, merchant or counterparty (partner) name, description (info field), amount**
- [**Balances**](/docs/bank-account-data/output-balances)**: current and available**

## Coverage

Our Account Information solution is available in all European Economic Area countries that are subject to PSD2 regulation. In all these countries GoCardless (GoCardless SAS (in EEA) or GoCardless Ltd. (in the UK)) operates as an authorized AISP.

You can find the full list of banks and their details [**here**](https://docs.google.com/spreadsheets/d/1EZ5n7QDGaRIot5M86dwqd5UFSGEDTeTRzEq3D9uEDkM/).

## Authentication

To use Account Information API, you are required to have access to GoCardless's [**Bank Account Data portal**](https://bankaccountdata.gocardless.com/user-secrets/) and acquire user secrets.

User secrets are used to create access tokens which in turn are used for client authentication and API request authorisation. More information about credential creation and deletion [**_here_**](https://bankaccountdata.zendesk.com/hc/en-gb/articles/11529532364700-Token-handling-via-API).

## Rate Limits

Banks may impose rate limits, down to 4 API calls per day for every account. Each endpoint (details, balances, transactions) has it own rate limit. If you exceed the rate limit, you will get an error.

#### Rate Limit Headers

To improve your API experience, our API provides a set of response headers with your API requests.

These headers will give you more insight into your rate limits:

**General Rate Limits** (applicable to all API requests):

- `HTTP_X_RATELIMIT_LIMIT`: indicates the maximum number of allowed requests within the defined time window.
- `HTTP_X_RATELIMIT_REMAINING`: shows the number of remaining requests you can make in the current time window.
- `HTTP_X_RATELIMIT_RESET`: provides the time remaining in the current window.

**Account Success Request** (additional headers per access scope for account details, transactions, and balances):

- `HTTP_X_RATELIMIT_ACCOUNT_SUCCESS_LIMIT`: indicates the maximum number of allowed requests within the defined time window.
- `HTTP_X_RATELIMIT_ACCOUNT_SUCCESS_REMAINING`: shows the number of remaining requests you can make in the current time window.
- `HTTP_X_RATELIMIT_ACCOUNT_SUCCESS_RESET`: provides the time remaining in the current window, in seconds.

These account success request headers will only be present for successful account resource requests. It's important to note that failed requests against details, balances and transactions endpoints, regardless of the error type, will not count against the account success request rate limits, but they will count towards the [general rate limits](https://bankaccountdata.zendesk.com/hc/en-gb/articles/11529637772188-Bank-Account-Data-API-Rate-Limits).

#### Handling Rate Limit Errors

If the limit is reached, a `RateLimitError` will be returned whenever you attempt to make an API call:

```json

```

When you receive a `RateLimitError`, the only option is to wait until the time returned in the `HTTP_X_RATELIMIT_ACCOUNT_SUCCESS_RESET` header has passed to execute your request. There is no need to reconnect the account before trying again.

## Customer Journey

The diagram below depicts an example of the customer journey for our clients' end users.

![Customer Journey - Bank Account Data](/images/docs/bank-account-data/customer_journey.png)

### Process Description

1. You assign a unique reference number to each of your end users, which is later used to identify the respective end user. With the unique identifier assigned, the end user then sees the first view, which is developed and hosted by you.

2. The end user is shown which financial institution they can link with the service. The list of available financial institutions is retrieved from the Bank Account Data API and depends on financial institutions GoCardless supports within any given country.

3. After the end user selects a financial institution, they are taken to the second view, which contains a consent text. This view is hosted by GoCardless. When the end user has accepted consent, they are directed to the next view.

4. The financial institution provides an interface for the end user to link their account data. This view is developed and hosted by the financial institution, therefore, neither you nor GoCardless can influence the look and feel of this view\*. The financial institution view depends on each financial institution.

5. After successful authentication, their access token is securely stored on the GoCardless side. The access token enables GoCardless to fetch bank account data from the respective financial institution.

6. As the final step, the end user is redirected to URL specified by you. If necessary, you can ask the end user to link another financial institution or conclude the process.

If the authentication wasn't successful where either the end user decided not to proceed, or the user did provide a wrong user name and/or password, the end user is redirected back to the initial application view, developed and hosted by you. The error message is attached as a query parameter in this case.

Once the end user has successfully concluded the process, you can access the raw data via the Bank Account Data API.

- Certain financial institutions do not provide their views for user authentication; they rely on GoCardless to provide means of collecting the end-user credentials. **GoCardless does not store nor process the end-user credentials!**

## Verification

New accounts have "non-verified" status, and your end-users will see an informative message (see image below). This doesn't impact any other features you are able to access on the API.
Account verification is only offered to paying customers - if you'd like to discuss your options, please [contact our team](https://bankaccountdata.zendesk.com/hc/en-gb/requests/new).

![Overview - Bank Account Data](/images/docs/bank-account-data/screenshot_2023-10-30_at_17.31.10.png)

## What's next?

#### [Quickstart Guide](/docs/bank-account-data/quickstart-guide)

Follow a step-by-step guide to connect your first bank account and retrieve transaction data.

#### [Account Details](/docs/bank-account-data/output-account-details)

Understand the account holder name and account number fields returned by the API.

#### [Transactions](/docs/bank-account-data/output-transaction-details)

Retrieve and interpret transaction history including merchant name, amount, and description.

#### [Statuses and Error Codes](/docs/bank-account-data/statuses-and-error-code)

Handle errors and understand the full set of status codes returned by the API.
