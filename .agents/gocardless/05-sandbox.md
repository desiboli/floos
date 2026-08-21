# Sandbox

Source: https://docs.gocardless.com/docs/bank-account-data/sandbox

## Account Information Sandbox

We have created Sandbox Finance which is a mock-up bank you can use to test Account Information product.

We suggest you follow the [Quickstart Guide](/docs/bank-account-data/quickstart-guide) for integration. Below are the guidelines on how to use Sandbox Finance in that process.

### Applying in Integration

There are two steps when one has to provide a unique identifier for an financial institution: creating an end user agreement and building a Link.

In those two steps, whenever you need to provide an institution_id, provide SANDBOXFINANCE_SFIN0000 as a value. When the end user accesses the link, it will start a connection with Sandbox Finance.

### Using in End User Flow

The end users can provide any input value for user id and code generator fields in the Sandbox Finance authentication page to continue the journey.

When the end user authenticates with Sandbox Finance, you can query results similar to any real connection.

![Bank Account Data Sandbox](/images/docs/bank-account-data/sandbox/sandbox_gocardless.png)

## What's next?

#### [Quickstart Guide](/docs/bank-account-data/quickstart-guide)

Follow the step-by-step guide to build your first integration.

#### [Statuses and Error Codes](/docs/bank-account-data/statuses-and-error-code)

Understand the statuses returned during sandbox and live testing.
