## Hubspot API & Webhook mock

This is a basic Hubspot REST API and webhook that you can use as a starting point to implement Hubspot Apps.  

I wrote this while developing a Hubspot app for the marketplace, this is why I implemented only a handful of endpoints around the Basic API and the Association API, in addition to a basic HTTP hook implementation and a basic token management API you can extend.

## mock coverage
Coverage is currently poor, but it's easy to extend depending on which endpoint you plan to use. Implemented actions are:

CRUD operations over basic resources:
* Creating, Updating, Getting, Listing companies in the connected Hubspot account
* Creating, Updating, Getting, Listing contacts in the connected Hubspot account
* Creating, Updating, Getting, Listing deals in the connected Hubspot account
* Creating, Updating, Getting, Listing tickets in the connected Hubspot account

Actions to associate resources each to the other:
* Associating a Contact with a Company
* Associating a Company with a Contact
* Associating a Contact with a Deal
* Associating a Deal with a Contact
* Associating a Contact with a Ticket
* Associating a Ticket with a Contact
* Listing Contacts associated with a Company
* Listing Companies associated with a Contact
* Listing Deals associated with a Contact
* Listing Contact associated with a Deal
* Listing Tickets associated with a Contact
* Listing Contact associated with a Ticket

Authentication & Authorization flows
* Getting a fake authorization code back
* Exchanging a authorization code with a fake token
* Exchanging a fake token with an object telling fake hubspot account id





## install & configure

Create a `.env` file in this directory and add your own variables:
```sh
WEBHOOK_URL=http://localhost:80
CUSTOMER_ID=1
APP_ID=1
```
`WEBHOOK_URL` is the URL where you plan to receive notifications back, if your app is running on port 80, you can use http://localhost:80 to have hubspot events notified to your app as they happen. `CUSTOMER_ID` and `APP_ID` need to be specified because the current mock is unable to understand who is the logged in customer and which is your App ID (these info do not belong to Hubspot API requests apparently, and the Hubspot token is not a standard JWT I could decode).


Run this command to install all dependences:

```bash
npm install
```
set your env vars out of your `.env` file
```bash
export $(cat .env | xargs)
```

then run the app server with
```bash
npm run dev
```
and it becomes available as a REST API at `http://localhost:8080`.

Or, alternatively, run it in a Docker container with
```bash
docker build -t . hubspot-mock
docker run -p 8080:8080 --env-file=.env hubspot-mock
```

If your client makes use of the [Hubspot Client SDK for NodeJS](https://github.com/HubSpot/hubspot-api-nodejs), you will need to override the `https://api.hubapi.com` default base URL and use the address of this API, e.g. `http://localhost:8080` (or `http://hubspot.local:8080` if you use a docker compose):

```javascript
const hubspot = require("@hubspot/api-client")
const options = { basePath: "http://localhost:8080" }
const hsClient = new hubspot.Client(options)

```