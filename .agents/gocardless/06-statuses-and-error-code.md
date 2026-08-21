# Statuses and Error Code

Source: https://docs.gocardless.com/docs/bank-account-data/statuses-and-error-code

Learn about statuses and error messages for different Bank Account Data endpoints.

## Statuses

### Requisitions

| Short | Long                      | Description                                                                      | Stage |
| ----- | ------------------------- | -------------------------------------------------------------------------------- | ----- |
| `CR`  | CREATED                   | Requisition has been successfully created                                        | 1     |
| `GC`  | GIVING_CONSENT            | End-user is giving consent at GoCardless's consent screen                        | 2     |
| `UA`  | UNDERGOING_AUTHENTICATION | End-user is redirected to the financial institution for authentication           | 3     |
| `RJ`  | REJECTED                  | Either SSN verification has failed or end-user has entered incorrect credentials | 4     |
| `SA`  | SELECTING_ACCOUNTS        | End-user is selecting accounts                                                   | 5     |
| `GA`  | GRANTING_ACCESS           | End-user is granting access to their account information                         | 6     |
| `LN`  | LINKED                    | Account has been successfully linked to requisition                              | 7     |
| `EX`  | EXPIRED                   | Access to accounts has expired as set in End User Agreement                      | 8     |

Stage describes the sequence of each possible status, where `1` is the starting status.

### Accounts

| Status       | Description                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------- |
| `DISCOVERED` | User has successfully authenticated, and account has been discovered                        |
| `ERROR`      | An error was encountered when processing account                                            |
| `EXPIRED`    | Access to account has expired as set in End User Agreement                                  |
| `PROCESSING` | Account is being processed by the institution                                               |
| `READY`      | Account has been successfully processed                                                     |
| `SUSPENDED`  | Account has been suspended (more than 10 consecutive failed attempts to access the account) |

## End user authentication messages

| Status                           | Description                                                                                            | HTTP status |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------- |
| `InstitutionTechnicalError`      | A technical error occurred while trying to connect to the institution, please try again.               | 500         |
| `GoCardlessTechnicalError`       | An unexpected error occurred in the GoCardless system. If this error persists, please contact support. | 500         |
| `RequisitionLinkReused`          | This link has already been used for authorization and is no longer valid.                              | 400         |
| `UserCancelledSession`           | User cancelled the session.                                                                            | 401         |
| `UserSessionRejected`            | User session rejected due to incorrect credentials or a business exception.                            | 401         |
| `CompanyRequisitionLimitReached` | Free usage limit exceeded.                                                                             | 402         |
| `UnknownError`                   | An unknown error occurred.                                                                             | —           |

## API error messages

All error HTTP codes are `4xx` or `5xx`. Use HTTP status codes for control flow and the error body for informative purposes. Errors are returned in this shape:

```json
",
  "status_code": 400
}
```

### Institutions

| Summary                          | Detail        | HTTP status |
| -------------------------------- | ------------- | ----------- |
| `Unknown fields  in the payload` |               | 400         |
|                                  | Invalid token | 401         |

### Agreements

| Summary                                                 | Detail                                                                                               | HTTP status |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------- |
| `Incorrect max_historical_days`                         | `max_historical_days` must be > 0 and \<= \ `transaction_total_days` (int)                           | 400         |
| `End User Agreements cannot be accepted more than once` |                                                                                                      | 400         |
| `Institution  is not operational`                       | Institution \ is down or under maintenance. Try again later or contact support for more information. | 503         |
| `Cannot delete End User Agreement`                      | Cannot delete accepted End User Agreement: \. Only non-accepted agreements can be deleted.           | 400         |
|                                                         | Invalid token                                                                                        | 401         |

### Requisitions

| Summary                                              | Detail                                                                                                       | HTTP status |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| `Invalid redirect URI`                               | Redirect URI must have a valid URI structure                                                                 | 400         |
| `Invalid EUA`                                        | \ is not a valid UUID. Please specify a valid agreement from `/api/agreements/enduser/` or create a new one. | 400         |
| `Incorrect enduser_id`                               | `enduser_id` in requisition must match the EUA \. Requisition `enduser_id`: \, EUA `enduser_id`: \           | 400         |
| `Provided user_language is invalid or not supported` | \ is invalid or not supported                                                                                | 400         |
| `Institution  is not operational`                    | Institution \ is down or under maintenance. Try again later or contact support for more information.         | 503         |
|                                                      | Invalid token                                                                                                | 401         |

### Accounts

| Summary                                 | Detail                                                                                                               | HTTP status |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------- |
| `Invalid Account ID`                    | \ is not a valid UUID                                                                                                | 400         |
| `End User Agreement (EUA)  has expired` | EUA was valid for \ days and expired at \. The end user must reconnect their account with a new EUA and Requisition. | 401         |
| `AccessExpiredError`                    | Access has expired or been revoked. To restore access, reconnect the account.                                        | 401         |
| `AccountInactiveError`                  | Account has been deactivated or no longer exists.                                                                    | 401         |
| `Invalid token`                         |                                                                                                                      | 401         |
| `AccountAccessForbidden`                | Access to the account is forbidden. The user might not have the necessary permissions.                               | 403         |
| `Account Suspended`                     | This account or its Requisition was suspended due to numerous errors while accessing it.                             | 409         |
| `AccountProcessing`                     | Account data is currently being processed. Poll `/accounts/\/` and retry when status is `READY`.                     | 409         |
| `RateLimitError`                        | The daily request limit set by the institution has been exceeded.                                                    | 429         |
| `UnknownRequestError`                   | Request to institution returned an unknown error.                                                                    | 500         |
| `ServiceError`                          | Institution service unavailable.                                                                                     | 503         |
| `ConnectionError`                       | Couldn't connect to institution.                                                                                     | 503         |

## What's next?

#### [Endpoints](/docs/bank-account-data/endpoints)

Full API reference for all Bank Account Data endpoints.

#### [Sandbox](/docs/bank-account-data/sandbox)

Test your integration against the Bank Account Data sandbox environment.
