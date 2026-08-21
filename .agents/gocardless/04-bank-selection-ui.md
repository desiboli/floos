# Bank Selection UI

Source: https://docs.gocardless.com/docs/bank-account-data/bank-selection-ui

This guide explains how to create end-user-facing UI to select the end-users bank.

## Step 1: Find Banks

First, query `institutions` endpoint to get a list of all available financial institutions in a given country.

```bash
curl -X GET "https://bankaccountdata.gocardless.com/api/v2/institutions/?country=gb"
-H  "accept: application/json"
-H  "Authorization: Bearer ACCESS_TOKEN"
```

Response:

```json
[
  ,
[...]
  ,
]
```

## Step 2: Create a UI element

You will need to create a UI or any other mechanism for selecting the end user's bank. To build the UI element you can either:

- use [open source JavaScript library](https://github.com/nordigen/nordigen-bank-ui) built by GoCardless that already incorporates best practices or,
- build the UI from scratch

Here are some considerations if UI is built from scratch:

1.  Have a clear call to action e.g. "Select your bank".
2.  Include additional support text if necessary. It's twice more likely that the end user goes trough Open Banking journey if the value proposition is stated clearly.
3.  Show available banks. Considerations:
    - Show both logo and a name of a bank;
    - Sort banks in alphabetical order or by popularity;
    - You can list all available banks in a given country or select only those ones that are used by your customer base;
    - Instead of listing the banks, show banks in a grid form if the bank list is not extensive.
4.  Add a bank search bar for better UX.
5.  Use styles that fit with the rest of your application.

## Step 3: Add Institution ID association

Once the end user selects their bank, make sure to pass the correct Institution ID when building the requisition and the link to start the end-user authentication process with the selected financial institution (see step 4 in the [Quickstart Guide](/docs/bank-account-data/quickstart-guide)).

## What's next?

#### [Quickstart Guide](/docs/bank-account-data/quickstart-guide)

Complete the integration by building the requisition and authentication link.

#### [Sandbox](/docs/bank-account-data/sandbox)

Test your bank selection UI against the Sandbox Finance mock bank.
