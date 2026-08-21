# Quickstart Guide

Source: https://docs.gocardless.com/docs/bank-account-data/quickstart-guide

This document explains how to jump-start your integration with the Bank Account Data API. For more detailed information on endpoint input parameters and response details, refer to section [Endpoints](/docs/bank-account-data/endpoints).

If you are using Postman, you can follow these [instructions](/docs/bank-account-data/postman-collection) on how to import Bank Account Data API schema.

## Step 1: Get User Secrets

First, you'll need to get your user secret from [GoCardless's Bank Account Data portal](https://bankaccountdata.gocardless.com/user-secrets/) in section User Secrets. Use these secrets to create a refresh token.

## Step 2: Get Refresh Token

The POST /api/v2/token/new/ endpoint takes the secret_id and secret_key and returns a long-lived refresh token.

```bash
curl -X POST "https://bankaccountdata.gocardless.com/api/v2/token/new/" \
  -H "accept: application/json" \
  -H  "Content-Type: application/json" \
  -d ""
```

Response:

```json

```

## Step 3: Refresh Your Access Token

The POST /api/v2/token/refresh/ endpoint is used subsequently to exchange the refresh token for a new access token.
When the access token is nearing expiry, use your stored refresh token to get a new, valid access token for continued API access. This avoids the need to go back to the user secrets.

```bash
curl -x POST 'https://bankaccountdata.gocardless.com/v2/token/refresh/' \
-H 'accept: application/json' \
-H 'Content-Type: application/json' \
-d '
```

Response:

```json

```

## Step 4: Choose a Bank

Use institutions endpoint to get a list of all available financial institutions in a given country. You will need to provide a two-letter country code ([ISO 3166](https://en.wikipedia.org/wiki/ISO_3166-1)). ID for the chosen bank will be used in the following steps (referenced as institution_id). Use SANDBOXFINANCE_SFIN0000 as institution_id if you wish to try out the Quickstart with the mock-up institution (see [Sandbox](/docs/bank-account-data/sandbox)).

See also the [guide](/docs/bank-account-data/bank-selection-ui) on how to build an end user interface for selecting a bank.

```bash
curl -X GET "https://bankaccountdata.gocardless.com/api/v2/institutions/?country=gb" \
  -H  "accept: application/json" \
  -H  "Authorization: Bearer ACCESS_TOKEN"
```

Response:

```json
[, ,]
```

## Step 5: Create an end user agreement

**NB!** Use this step only if you want to specify other than default end user agreement terms: 90 days of transaction history, 90 days of account access period and full scope of information (details, balances, transactions). If no custom end user agreement is created, default terms will be applied.

You need to create an agreement and pass:

- institution_id from Step 2.

And optionally:

- max_historical_days as the length of the transaction history to be retrieved;
- access_valid_for_days as the length of days while the access to account is valid;
- access_scope for the scope of information.

```bash
curl -X POST "https://bankaccountdata.gocardless.com/api/v2/agreements/enduser/" \
  -H  "accept: application/json" \
  -H  "Content-Type: application/json" \
  -H  "Authorization: Bearer ACCESS_TOKEN" \
  -d ""
```

Response:

```json

```

## Step 6: Build a Link

You need to create a requisition, which is a collection of inputs for creating links and retrieving accounts. For requisition API requests you will need to provide:

- institution_id from Step 2;
- redirect URL where the end user will be redirected after finishing authentication in financial institution;

And optionally:

- reference as a unique ID defined by you for internal referencing;
- agreement as end user agreement ID from Step 3;
- user_language to enforce a language for all end user steps hosted by GoCardless passed as a two-letter country code ([ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)). If user_language is not defined a language set in browser will be used to determine language.

```bash
curl -X POST "https://bankaccountdata.gocardless.com/api/v2/requisitions/" \
  -H  "accept: application/json" -H  "Content-Type: application/json" \
  -H  "Authorization: Bearer ACCESS_TOKEN" \
  -d ""
```

Response:

```json
",
  "ssn": "string",
  "account_selection": false,
  "redirect_immediate": false
}
```

Follow the link to start the end-user authentication process with the financial institution. Save the requisition ID (id in the response). You will later need it to retrieve the list of end-user accounts.

## Step 7: List accounts

Once the user is redirected back to the link provided in Step 4, the user's bank accounts can be listed. Pass the requisition ID to view the accounts.

```bash
curl -X GET "https://bankaccountdata.gocardless.com/api/v2/requisitions/8126e9fb-93c9-4228-937c-68f0383c2df7/" \
  -H  "accept: application/json" \
  -H  "Authorization: Bearer ACCESS_TOKEN"
```

Response:

```json

```

## Step 8: Access account details, balances and transactions

There are three separate endpoints for accessing account details, balances, and transactions. See account [endpoints](/docs/bank-account-data/endpoints) to view respective endpoints.

In this quickstart, we will showcase the transactions' endpoint, where you need to pass the account ID (see "accounts" from the output of Step 5) to access transaction information. You will need to query each account separately.

```bash
curl -X GET "https://bankaccountdata.gocardless.com/api/v2/accounts/065da497-e6af-4950-88ed-2edbc0577d20/transactions/" \
  -H  "accept: application/json" \
  -H  "Authorization: Bearer ACCESS_TOKEN"
```

Response:

```json
,
        "transactionAmount": ,
        "bookingDate": "2020-10-30",
        "valueDate": "2020-10-30",
        "remittanceInformationUnstructured": "For the support of Restoration of the Republic foundation"
      },
      ,
        "bankTransactionCode": "PMNT",
        "bookingDate": "2020-11-11",
        "valueDate": "2020-11-11",
        "remittanceInformationUnstructured": "PAYMENT Alderaan Coffe"
      }
    ],
    "pending": [
      ,
        "valueDate": "2020-11-03",
        "remittanceInformationUnstructured": "Reserved PAYMENT Emperor's Burgers"
      }
    ]
  }
}
```

## What's next?

You can now connect to end-user bank accounts and retrieve raw account and transaction data. Data structures vary between banks — some may include fields like `ownerName` while others may not. If you spot any specific issues, [contact us](https://bankaccountdata.zendesk.com/hc/en-gb/requests/new).

#### [Output: Account Details](/docs/bank-account-data/output-account-details)

Understand the account details fields returned by the API and how to interpret them.

#### [Output: Balances](/docs/bank-account-data/output-balances)

See all balance types returned and what each one represents.

#### [Output: Transaction Details](/docs/bank-account-data/output-transaction-details)

Explore the transaction data fields including amounts, dates, and remittance information.

#### [Endpoints](/docs/bank-account-data/endpoints)

Full API reference for all Bank Account Data endpoints.
