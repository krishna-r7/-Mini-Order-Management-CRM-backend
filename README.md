# Mini Order Management CRM --- Backend

A NestJS backend for a Shopify-integrated Order Management CRM. It
stores Shopify orders and line items in PostgreSQL using Prisma, exposes
order-management APIs, and processes Shopify order creation and update
webhooks.

## Live Demo

**Frontend:** https://order-crm.netlify.app/

**Backend API:** https://mini-order-management-crm-backend.onrender.com

The frontend is deployed on Netlify and connects to the NestJS backend for order listing, searching, filtering, pagination, and order details.

Shopify order creation and update events are handled by the backend through configured webhooks.

## Tech Stack

-   NestJS
-   TypeScript
-   PostgreSQL
-   Prisma ORM
-   Shopify Webhooks
-   HMAC-SHA256 webhook signature verification

## Features

-   Store Shopify orders and line items in PostgreSQL.
-   Process `orders/create` and `orders/updated` webhook events.
-   Verify Shopify webhook signatures using the raw request body.
-   Avoid duplicate webhook processing using a unique webhook ID.
-   Ignore older order-update events when a newer version is already
    stored.
-   Use database transactions when saving an order and its line items.
-   Support order listing, searching, filtering, pagination, and order
    details through the application's order API.

## Prerequisites

-   Node.js (use a version supported by the project's `package.json`)
-   npm
-   PostgreSQL
-   A Shopify development store and a Shopify app configured to send
    order webhooks

## Getting Started

### 1. Install dependencies

``` bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the backend project root. Use the variable names
expected by your application and never commit real credentials.

``` env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
SHOPIFY_WEBHOOK_SECRET="your_shopify_webhook_signing_secret"
```

`SHOPIFY_WEBHOOK_SECRET` must be the secret used to sign the webhooks
sent to this backend. Do not confuse it with a Shopify Admin API access
token.

### 3. Apply Prisma migrations

Run the migration command used by this repository. For a standard Prisma
project, this is commonly:

``` bash
npx prisma migrate deploy
```

For local development when creating new migrations, use:

``` bash
npx prisma migrate dev
```

If your project uses a different Prisma v7 configuration or migration
workflow, follow the existing project configuration.

### 4. Start the backend

Development:

``` bash
npm run start:dev
```

Production build:

``` bash
npm run build
npm run start:prod
```

Check `package.json` for the exact scripts available in this repository.

## Shopify Webhook Configuration

Configure the Shopify app to send these topics to the deployed backend:

  ------------------------------------------------------------------------------------------------------------------------------
  Topic                               Endpoint
  ----------------------------------- ------------------------------------------------------------------------------------------
  `orders/create`                     `https://mini-order-management-crm-backend.onrender.com/webhooks/shopify/orders-create`

  `orders/updated`                    `https://mini-order-management-crm-backend.onrender.com/webhooks/shopify/orders-updated`
  ------------------------------------------------------------------------------------------------------------------------------

The backend must receive the original request body so it can verify the
Shopify HMAC signature. The application configures NestJS with
`rawBody: true`.

Ensure the Shopify app has the required order-reading permission and
that the webhook subscriptions are active. Shopify webhook delivery and
the backend's successful database processing should be monitored
separately.

## Order Synchronization Flow

1.  Shopify sends an order creation or update webhook.
2.  The backend validates the webhook signature.
3.  The payload is parsed and validated.
4.  A database transaction records the webhook ID and creates or updates
    the order and line items.
5.  Duplicate deliveries are skipped, and older order updates are
    ignored.

Webhooks provide event-driven synchronization. If the project needs
stronger recovery from missed deliveries, consider adding periodic
reconciliation between Shopify and PostgreSQL.

## API Documentation

The exact order API routes depend on the controllers in this repository.
Check the NestJS controllers for the available endpoints and request
parameters, including pagination, search, filtering, and order details.

## Deployment

The backend is deployed on Render:

`https://mini-order-management-crm-backend.onrender.com`

Set `DATABASE_URL` and `SHOPIFY_WEBHOOK_SECRET` in the Render
environment configuration. Do not store secrets in source control. After
deployment, verify the service is healthy and confirm webhook
subscriptions point to the deployed endpoints.

## Error Handling and Reliability

-   Invalid webhook signatures are rejected.
-   Invalid JSON or payload fields are rejected.
-   Duplicate webhook deliveries are handled using the unique webhook
    ID.
-   Order and line-item changes are grouped in a database transaction.
-   Database failures are logged and propagated so the request does not
    falsely report success.

Shopify may retry failed webhook deliveries, but retries alone do not
guarantee that every order will eventually be synchronized. Monitor
failures and consider a reconciliation process for recovery.

## Security Notes

-   Keep `.env` out of version control.
-   Never publish Shopify secrets or database credentials.
-   Verify webhook signatures against the raw request body.
-   Use HTTPS for deployed webhook endpoints.
-   Grant only the Shopify permissions the app needs.

## Project Structure

Typical NestJS areas include:

-   `src/` --- application source
-   Shopify webhook controller/service --- webhook routes and processing
-   Prisma service/module --- database access
-   `prisma/` --- schema and migrations

Use the actual folder and file names in this repository if they differ.

## License

Add the applicable license if this project is distributed publicly.



## Shopify Order Sync API

### Purpose

The Sync API allows the application to synchronize Shopify order data with the PostgreSQL database for testing and order management.

### Endpoint

`POST /shopify/sync`

**Base URL:** `https://mini-order-management-crm-backend.onrender.com`

### Testing

1. Send a POST request to the Sync API using Postman.
2. Check the response for synchronization status and any errors.
3. Verify that the corresponding orders and line items are stored in PostgreSQL.
4. Open the CRM frontend and confirm the synchronized orders appear.

**Note:** Replace `/shopify/syncorders` with the actual route configured in your backend. This endpoint should only be documented as available if it is implemented.



### Setting Up a New PostgreSQL Database

1. Create an empty PostgreSQL database.
2. Configure `DATABASE_URL` in the backend `.env` file.
3. Install project dependencies using `npm install`.
4. Generate the Prisma client using `npx prisma generate`.
5. Apply committed database migrations using `npx prisma migrate deploy`.
6. Start the backend using `npm run start:dev`.

Prisma migrations create the required tables, relationships, indexes, and constraints. No manual table creation should be necessary when all required migration files are included in the repository.

**Important:** Do not use `prisma migrate reset` on a database containing data you need to preserve, because it resets the database and can delete data.
