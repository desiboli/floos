Source: https://enablebanking.com/docs/api/quick-start/

Quick Start with Enable Banking API
Welcome to the Quick Start guide for the Enable Banking API! This guide will help you quickly get up and running with the API so you can start building innovative financial applications.

Signing up for an account
Before you can begin using the Enable Banking API, you'll need to sign up for an account to Enable Banking Control Panel. Follow these steps:

Visit the authentication page https://enablebanking.com/sign-in/ (opens new window).
Enter your email, new accounts are automatically created on the first sign in.
Follow the one-time authentication link sent to your email. After authentication you will be redirected your profile in the Control.
Registering an application
Once you have an account, you can register your application to obtain API access:

Go to the API applications (opens new window)page using the top menu of the Control Panel.
Fill out "Add a new application" form:
Keep the Sandbox environment and the default option for creation of the application's private key;
Fill in the name of your application (this name will be shown to end users when they will be requested to authorise sharing of their account information with your application or to confirm a payment initiated by your application);
Enter URLs whitelisted for redirecting of end users after they complete authorisation of access to account information or confirm a payment.
Submit the form by pressing "Register" button. Your web browser will generate a private key for the application and it will be saved into your downloads folder. The file name will be the ID that was assigned to the newly registered application (e.g., aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pem).
Creating JWT for API authorisation
To authenticate with the API, your application will need to use JSON Web Tokens generated using the private key saved during the registration process described above. Here is a sample implementation:

Import a library allowing to generate JSON Web Tokens using RS256 algorithm:

PythonJavaScript
const jwa = require("jwa")
Most modern languages will have a number of libraries for JWT generation in their ecosystems.

An extensive list of libraries for JWT generation can be found at https://jwt.io/libraries (opens new window).

Import other necessary libraries and write the necessary helper functions:

PythonJavaScript
const fs = require("fs")

const jsonBase64 = (data) => {
return Buffer.from(JSON.stringify(data)).toString("base64").replace("=", "")
}
This part significantly varies depending on the programming language you choose and the library you use for JWT generation.

Read application's private key from a file:

PythonJavaScript
const privateKey = fs.readFileSync("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pem", "utf8")
Note that some libraries do not require you to load the private key from a file but rather allow you to pass the path to the file as a parameter.

Prepare the JWT payload (also known as the body):

PythonJavaScript
const iat = Math.floor((new Date()).getTime() / 1000)
const jwtBody = {
iss: "enablebanking.com", // always the same value
aud: "api.enablebanking.com", // always the same value
iat: iat, // time when the token is created
exp: iat + 3600 // time when the token is set to expire
}
Create the JWT with its header and signature:

PythonJavaScript
const jwt = ((exp = 3600) => {
const header = jsonBase64({
typ: "JWT",
alg: "RS256",
kid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" // your application's ID
})
const body = jsonBase64(jwtBody)
const signature = jwa("RS256").sign(`${header}.${body}`, privateKey)
return `${header}.${body}.${signature}`
})()
Prepare the authorisation header for sending with every API request:

PythonJavaScript
const baseHeaders = {
Authorization: `Bearer ${jwt}`
}
Your application needs to send the above created authorisation header with every request it makes to Enable Banking API.

The full specification of the JWT format expected by Enable Banking API can be found in the API reference.

Accessing account information
With authentication in place, you can start accessing account information from ASPSPs (banks and similar financial institutions):

To obtain the list of available ASPSPs in a country, send a GET request to the ASPSPs endpoint specifying the desired country in the country query parameter in the format of Two-letter ISO 3166 code:

PythonJavaScript
const fetch = require('node-fetch');

const aspspsResponse = await fetch(`https://api.enablebanking.com/aspsps?country=FI`, {
headers: baseHeaders
})
// If you want you can override BANK_NAME and BANK_COUNTRY with any bank from this list
console.log(`Available ASPSPs: ${await aspspsResponse.text()}`)
The first step in obtaining account information is to start the authorisation process. To do this, send a POST request to the authorisation endpoint, specifying a bank name and a country from the list returned from ASPSPs endpoint.

PythonJavaScript
// 10 days ahead
const validUntil = new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000);
const startAuthorizationBody = {
access: {
valid_until: validUntil.toISOString()
},
aspsp: {
name: "Nordea", // BANK_NAME
country: "FI" // BANK_COUNTRY
},
state: "123e4567-e89b-12d3-a456-426614174000",
redirect_url: "https://example.com/redirect", // application's redirect URL
psu_type: "personal"
}
const startAuthorizationResponse = await fetch(`https://api.enablebanking.com/auth`, {
method: "POST",
headers: baseHeaders,
body: JSON.stringify(startAuthorizationBody)
})
const startAuthorizationData = await startAuthorizationResponse.text();
console.log(`Start authorization data: ${startAuthorizationData}`)
The response will contain a redirect URL to which you should redirect the end user to complete the authorisation process. After the end user completes the authorisation process, they will be redirected to the URL you specified during the application registration. The URL will contain a query parameter named code which will be used to authorize the user session

PythonJavaScript
console.log(`To authenticate open URL ${startAuthorizationData}`)
To authorize the user session send a POST request to the sessions endpoint, specifying the code received in the authorisation endpoint. In the response you will receive a session ID, with the list of authorized accounts.

PythonJavaScript
const createSessionBody = {
code: code
}
const createSessionResponse = await fetch(`https://api.enablebanking.com/sessions`, {
method: "POST",
headers: baseHeaders,
body: JSON.stringify(createSessionBody)
})
const session = await createSessionResponse.text()
console.log(`New user session has been created: ${session}`)
To obtain the list of balances for the authorized accounts, send a GET request to the balances endpoint, specifying the account ID in the URL.

PythonJavaScript
// Using the first available account for the following API calls
const accountId = JSON.parse(session).accounts[0]
const accountBalancesResponse = await fetch(`https://api.enablebanking.com/accounts/${accountId}/balances`, {
headers: baseHeaders
})
console.log(`Account balances data: ${await accountBalancesResponse.text()}`)
To obtain the list of transactions for the authorized accounts, send a GET request to the transactions endpoint, specifying the account ID in the URL.

PythonJavaScript
const accountTransactionsResponse = await fetch(`https://api.enablebanking.com/accounts/${accountId}/transactions`, {
headers: baseHeaders
})
console.log(`Account transactions data: ${await accountTransactionsResponse.text()}`)
you can refer to the API reference for more details on the API endpoints.

Full source code in our GitHub:

PythonJavaScript
https://github.com/enablebanking/enablebanking-api-samples/blob/master/js_example/accountInformation.js(opens new window)

Initiating payments
If your application requires payment initiation functionality, you can use the Enable Banking API for this purpose:

To initiate a payment, send a POST request to the Create Payment endpoint, specifying the payment details in the request body.

PythonJavaScript
const body = {
"payment_type": "SEPA",
"payment_request": {
"credit_transfer_transaction": [
{
"beneficiary": {
"creditor_account": {
"scheme_name": "IBAN",
"identification": "FI7473834510057469",
},
"creditor": {
"name": "Test",
},
},
"instructed_amount": { "amount": "2.00", "currency": "EUR" },
"reference_number": "123",
}
],
},
"aspsp": { "name": "Nordea", "country": "FI" },
"state": "123e4567-e89b-12d3-a456-426614174000",
"redirect_url": "https://example.com/redirect", // application's redirect URL
"psu_type": "personal",
}
const paymentResponse = await fetch(`https://api.enablebanking.com/payments`, {
method: "POST",
headers: baseHeaders,
body: JSON.stringify(body)
})
const paymentData = await paymentResponse.text();
console.log(`Payment data: ${paymentData}`)
const payment = JSON.parse(paymentData)
The response will contain a redirect URL to which you should redirect the end user to complete the payment initiation process. Use following credentials to authenticate: customera / 12345678

PythonJavaScript
console.log("To authenticate open URL:")
console.log(payment.url)
To get the status of the initiated payment, send a GET request to the Get Payment endpoint, specifying the payment ID in the URL.

PythonJavaScript
// This request can be called multiple times to check the status of the payment
const paymentId = paymentDataJson.payment_id
const paymentStatusResponse = await fetch(`${BASE_URL}/payments/${paymentId}`, {
headers: baseHeaders
})
const paymentStatusData = await paymentStatusResponse.text()
console.log(`Payment status data: ${paymentStatusData}`)
Full source code in our GitHub:

PythonJavaScript
https://github.com/enablebanking/enablebanking-api-samples/blob/master/js_example/paymentInitiation.js(opens new window)

Next steps
Congratulations! You've gone through the essential steps to get started with the Enable Banking API. Here are some suggested next steps:

Explore the API reference to learn more about the API endpoints and their parameters.
Check out code samples and a Postman collections in our GitHub repository (opens new window).
Discover the Control Panel where you can manage apps, configure settings, and monitor activity.
Learn how to test your API integrations in the Sandbox and how to get restricted access to the production environment for testing with your own bank accounts.
If you have any questions or run into issues, don't hesitate to reach out for assistance.

Happy coding!
