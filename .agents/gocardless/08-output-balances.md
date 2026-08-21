# Output: Balances

Source: https://docs.gocardless.com/docs/bank-account-data/output-balances

## Account Balance Output

This section contains key descriptions for balances.

### Balance

| KEY                           | TYPE         | OPTIONAL  | DESCRIPTION                                                                                                                                           |
| ----------------------------- | ------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **balanceAmount**             | Amount       | Mandatory | an object containing: **amount** Float **currency** Max3Text                                                                                          |
| **balanceType**               | Balance Type | Mandatory |                                                                                                                                                       |
| **creditLimitIncluded**       | Boolean      | Optional  | A flag indicating if the credit limit of the corresponding account is included in the calculation of the balance, where applicable.                   |
| **lastChangeDateTime**        | ISODateTime  | Optional  | This data element might be used to indicate e.g. with the expected or booked balance that no action is known on the account, which is not yet booked. |
| **lastCommitted Transaction** | Max35Text    | Optional  | entryReference of the last commited transaction to support the TPP in identifying whether all end users transactions are already known.               |
| **referenceDate**             | ISODate      | Optional  | indicates the date of the balance                                                                                                                     |

### Balance Type

| TYPE                       | DESCRIPTION                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **closingAvailable**       | Closing balance of amount of money that is at the disposal of the account owner on the date specified.                                                                                                                                                                                                                                                                                                                      |
| **closingBooked**          | Balance of the account at the end of the pre-agreed account reporting period. It is the sum of the opening booked balance at the beginning of the period and all entries booked to the account during the pre-agreed account reporting period. For card-accounts, this is composed of - invoiced, but not yet paid entries                                                                                                  |
| **closingCleared**         | Closing balance of amount of money that is cleared on the date specified.                                                                                                                                                                                                                                                                                                                                                   |
| **expected**               | Balance composed of booked entries and pending items known at the time of calculation, which projects the end of day balance if everything is booked on the account and no other entry is posted. For card accounts, this is composed of - invoiced, but not yet paid entries, - not yet invoiced but already booked entries and - pending items (not yet booked)                                                           |
| **forwardAvailable**       | Forward available balance of money that is at the disposal of the account owner on the date specified.                                                                                                                                                                                                                                                                                                                      |
| **interimAvailable**       | Available balance calculated in the course of the account 'servicer's business day, at the time specified, and subject to further changes during the business day. The interim balance is calculated on the basis of booked credit and debit items during the calculation time/period specified. For card-accounts, this is composed of - invoiced, but not yet paid entries, - not yet invoiced but already booked entries |
| i**nterimCleared**         | Cleared balance calculated in the course of the account servicer's business day, at the time specified, and subject to further changes during the business day.                                                                                                                                                                                                                                                             |
| **information**            | Balance for informational purposes.                                                                                                                                                                                                                                                                                                                                                                                         |
| **interimBooked**          | Balance calculated in the course of the account servicer's business day, at the time specified, and subject to further changes during the business day. The interim balance is calculated on the basis of booked credit and debit items during the calculation time/period specified.                                                                                                                                       |
| **nonInvoiced**            | Only for card accounts, to be defined yet.                                                                                                                                                                                                                                                                                                                                                                                  |
| **openingBooked**          | Book balance of the account at the beginning of the account reporting period. It always equals the closing book balance from the previous report.                                                                                                                                                                                                                                                                           |
| **openingAvailable**       | Opening balance of amount of money that is at the disposal of the account owner on the date specified.                                                                                                                                                                                                                                                                                                                      |
| **openingCleared**         | Opening balance of amount of money that is cleared on the date specified.                                                                                                                                                                                                                                                                                                                                                   |
| **previouslyClosedBooked** | Balance of the account at the previously closed account reporting period. The opening booked balance for the new period has to be equal to this balance. Usage: the previously booked closing balance should equal (inclusive date) the booked closing balance of the date it references and equal the actual booked opening balance of the current date.                                                                   |

## What's next?

#### [Output: Transaction Details](/docs/bank-account-data/output-transaction-details)

Explore the transaction data fields including amounts, dates, and remittance information.

#### [Endpoints](/docs/bank-account-data/endpoints)

Full API reference for all Bank Account Data endpoints.
