# Output: Account Details

Source: https://docs.gocardless.com/docs/bank-account-data/output-account-details

## Account Details

This section contains key descriptions for accounts.

| KEY                          | TYPE              | OPTIONAL    | DESCRIPTION                                                                                                                                                                                                                                                           |
| ---------------------------- | ----------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **bban**                     | Max128Text        | Optional    | This data element is used for payment accounts which have no IBAN                                                                                                                                                                                                     |
| **bic**                      | Max128Text        | Optional    | The BIC associated to the account.                                                                                                                                                                                                                                    |
| **cashAccountType**          | Cash Account Type | Optional    | ExternalCashAccountType1Code from ISO 20022                                                                                                                                                                                                                           |
| **currency**                 | Max3Text          | Mandatory   | Account currency                                                                                                                                                                                                                                                      |
| **details**                  | Max512Text        | Optional    | Specifications that might be provided by the financial institution - characteristics of the account - characteristics of the relevant card                                                                                                                            |
| **displayName**              | Max128Text        | Optional    | Name of the account as defined by the end user within online channels                                                                                                                                                                                                 |
| **iban**                     | Max34Text         | Optional    |                                                                                                                                                                                                                                                                       |
| **linkedAccounts**           | Max128Text        | Optional    | This data attribute is a field, where an financial institution can name a cash account associated to pending card transactions.                                                                                                                                       |
| **msisdn**                   | Max64Text         | Optional    | An alias to a payment account via a registered mobile phone number                                                                                                                                                                                                    |
| **name**                     | Max128Text        | Optional    | Name of the account, as assigned by the financial institution                                                                                                                                                                                                         |
| **ownerAddressUnstructured** | Max256Text        | Optional    | Address of the legal account owner                                                                                                                                                                                                                                    |
| **ownerName**                | Max256Text        | Optional    | Name of the legal account owner. If there is more than one owner, then e.g. two names might be noted here. For a corporate account, the corporate name is used for this attribute.                                                                                    |
| **product**                  | Max64Text         | Optional    | Product Name of the Bank for this account, proprietary definition                                                                                                                                                                                                     |
| **resourceId**               | Max128Text        | Conditional | The account id of the given account in the financial institution                                                                                                                                                                                                      |
| **status**                   | Max7Text          | Optional    | Account status. The value is one of the following: "enabled": account is available "deleted": account is terminated "blocked": account is blocked e.g. for legal reasons If this field is not used, then the account is available in the sense of this specification. |
| **scan**                     | Max14Text         | Optional    | SortCodeAccountNumber returned by some UK banks (6 digit Sort Code and 8 digit Account Number)                                                                                                                                                                        |
| **usage**                    | Max4Text          | Optional    | Specifies the usage of the account PRIV: private personal account ORGA: professional account                                                                                                                                                                          |

## What's next?

#### [Output: Balances](/docs/bank-account-data/output-balances)

See all balance types returned and what each one represents.

#### [Output: Transaction Details](/docs/bank-account-data/output-transaction-details)

Explore the transaction data fields including amounts, dates, and remittance information.
