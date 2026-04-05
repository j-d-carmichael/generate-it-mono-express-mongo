# generate-it mono express + mongo template

A [generate-it](https://acr-lfr.github.io/generate-it/#/) template for a TypeScript Express API with MongoDB (Mongoose/Typegoose) and WorkOS AuthKit authentication.

Point generate-it at your OpenAPI spec and this template to get a fully wired API with authentication, database, migrations, email, permissions, validation, and more — all ready to extend.

<!-- npx doctoc --github README.md  -->

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [What you get](#what-you-get)
- [High level design](#high-level-design)
  - [Design philosophy](#design-philosophy)
  - [Managed vs developer-owned files](#managed-vs-developer-owned-files)
- [Authentication — WorkOS AuthKit](#authentication--workos-authkit)
  - [Environment variables](#environment-variables)
  - [WorkOS Dashboard setup](#workos-dashboard-setup)
  - [Auth routes](#auth-routes)
  - [Accessing the authenticated user](#accessing-the-authenticated-user)
  - [Swapping auth providers](#swapping-auth-providers)
- [MongoDB and Typegoose](#mongodb-and-typegoose)
  - [Database configuration](#database-configuration)
  - [Repository pattern](#repository-pattern)
  - [Migrations with migrate-mongo](#migrations-with-migrate-mongo)
- [Email — nunjucks-emailer](#email--nunjucks-emailer)
- [Permissions](#permissions)
  - [Route-level permissions via OpenAPI](#route-level-permissions-via-openapi)
  - [Permission syncing](#permission-syncing)
- [Injecting into the http layer](#injecting-into-the-http-layer)
- [OpenAPI spec helpers](#openapi-spec-helpers)
  - [Access full request in domain](#access-full-request-in-domain)
  - [Allow non-authenticated requests — x-passThruWithoutJWT](#allow-non-authenticated-requests--x-passthruwithoutjwt)
  - [Input/output validation](#inputoutput-validation)
  - [Async route validation — x-async-validators](#async-route-validation--x-async-validators)
  - [Inferring output content-type](#inferring-output-content-type)
  - [Caching — x-cache](#caching--x-cache)
  - [Raw body — x-raw-body](#raw-body--x-raw-body)
  - [Errors](#errors)
- [CLI scripts](#cli-scripts)
- [Testing](#testing)
- [Utilities](#utilities)
- [Setup](#setup)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## What you get

| Feature | Implementation |
|---|---|
| **Runtime** | Node.js + TypeScript + Express 5 |
| **Authentication** | [WorkOS AuthKit](https://workos.com/docs/authkit) via sealed session cookies |
| **Database** | MongoDB via [Mongoose](https://mongoosejs.com/) + [Typegoose](https://typegoose.github.io/typegoose/) |
| **Migrations** | [migrate-mongo](https://github.com/seppevs/migrate-mongo) — runs automatically on startup |
| **Validation** | [Celebrate](https://www.npmjs.com/package/celebrate) (Joi) for input, [object-reduce-by-map](https://www.npmjs.com/package/object-reduce-by-map) for output |
| **Email** | [nunjucks-emailer](https://www.npmjs.com/package/nunjucks-emailer) with Nunjucks templates |
| **Permissions** | OpenAPI `x-permission` extraction + database sync |
| **Logging** | [Winston](https://www.npmjs.com/package/winston) + [Morgan](https://www.npmjs.com/package/morgan) access logs |
| **Security** | [Helmet](https://www.npmjs.com/package/helmet), CORS, cookie-parser |
| **Testing** | [Jest](https://jestjs.io/) + [Supertest](https://www.npmjs.com/package/supertest) |
| **CLI** | Run scripts with full app context via `npm run cli-script` |

## High level design

The http layer is completely managed by generate-it and lives at the location specified by the `.nodegenrc` `nodegenDir` key (default `src/http/`). All files in that folder are **overwritten on each generation**.

The `app.ts` calls `src/http/index.ts` which returns the initialised Express app. You can inject middleware and other options via the `HttpOptions` interface — see `src/http/index.ts`.

The domain layer (`src/domains/`) is where all business logic lives. Domains are generated as [stub files](https://acr-lfr.github.io/generate-it/#/_pages/templates?id=stub) — created once if they don't exist, never overwritten.

### Design philosophy

Influenced by traditional [MVC](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) and frameworks like [Laravel](https://laravel.com/) and [Symfony](https://symfony.com/):

1. **`app.ts`** — loads database connections, sets up the Express app
2. **Generated routes** (`src/http/nodegen/routesImporter.ts`) — handle HTTP traffic, input/output validation
3. **Domains** (`src/domains/`) — your business logic, one method per route
4. **`inferResponseType`** middleware — formats the domain's return value based on the client's `Accept` header and the OpenAPI `produces` definition

### Managed vs developer-owned files

| Location | Managed? | Notes |
|---|---|---|
| `src/http/nodegen/` | Yes — overwritten on generation | Routes, middleware, interfaces |
| `src/domains/` | Stubs — created once, never overwritten | Your business logic |
| `src/services/` | Developer-owned | Auth, email, permissions, cache, etc. |
| `src/database/` | Developer-owned | Repositories and Typegoose models |
| `src/config.ts` | Developer-owned | All environment configuration |

## Authentication — WorkOS AuthKit

Authentication uses [WorkOS AuthKit](https://workos.com/docs/authkit) with sealed session cookies. The implementation is split across three developer-owned services:

- **`src/services/WorkOsService.ts`** — owns the WorkOS SDK instance, exposes `getAuthorizationUrl()`, `authenticateWithCode()`, `getLogoutUrl()`, and `loadSealedSession()`
- **`src/services/AccessTokenService.ts`** — middleware-facing; validates the `wos-session` cookie on protected routes, handles transparent session refresh
- **`src/services/AuthRoutesService.ts`** — Express router with `/auth/login`, `/auth/callback`, and `/auth/logout` endpoints

### Environment variables

| Variable | Description |
|---|---|
| `WORKOS_API_KEY` | Your WorkOS API key |
| `WORKOS_CLIENT_ID` | Your WorkOS client ID |
| `WORKOS_COOKIE_PASSWORD` | A 32+ character secret for sealing session cookies |
| `WORKOS_REDIRECT_URI` | Callback URL (default: `http://localhost:8080/auth/callback`) |

### WorkOS Dashboard setup

1. Add your `WORKOS_REDIRECT_URI` as a **Redirect URI**
2. Set the **Sign-in endpoint** to `{baseUrl}/auth/login`
3. Configure the **Sign-out redirect** to wherever users should land after logout

### Auth routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/auth/login` | Redirects to WorkOS hosted sign-in |
| `GET` | `/auth/callback` | Exchanges auth code for sealed session cookie |
| `POST` | `/auth/logout` | Clears session cookie, redirects to WorkOS logout |

These routes are registered in `routesImporter.ts.njk` and mounted at `{basePath}/auth`.

### Accessing the authenticated user

On protected routes the authenticated WorkOS `User` object is available on the request:

```typescript
// In a domain method receiving the full request:
const user = req.workosUser; // typed as WorkOS User
const userId = req.workosUser?.id;

// req.jwtData is also set to the same user object for backward compatibility
```

### Swapping auth providers

The auth middleware maps to `src/services/AccessTokenService.ts`. To use a different provider, replace `AccessTokenService` and `WorkOsService` — the route template and middleware wiring remain unchanged.

## MongoDB and Typegoose

### Database configuration

Connection is managed by [load-mongoose](https://www.npmjs.com/package/load-mongoose) with configuration in `src/config.ts`:

| Variable | Description | Default |
|---|---|---|
| `MONGO_HOST` | Database host | — |
| `MONGO_DB` | Database name | `package.json` name |
| `MONGO_USER` | Database user | — |
| `MONGO_PW` | Database password | — |
| `MONGO_PORT` | Port (omit for SRV) | `false` |
| `MONGO_PROTOCOL` | `mongodb` or `mongodb+srv` | `mongodb+srv` |
| `MONGO_URI` | Full URI override | `false` |
| `MONGO_SSL` | SSL option | — |

### Repository pattern

Models use [Typegoose](https://typegoose.github.io/typegoose/) and live in `src/database/models/`. Repositories extend `BaseRepository<T>` and live in `src/database/`:

```typescript
// src/database/UserRepository.ts
class UserRepository extends BaseRepository<UserClass> {
  constructor() {
    super(UserModel);
  }
  findByEmail(email: string) {
    return this.model.findOne({ email });
  }
}
```

### Migrations with migrate-mongo

Database migrations use [migrate-mongo](https://github.com/seppevs/migrate-mongo). Migrations run automatically on startup via `src/utils/migrationRunner.ts` (called from `src/utils/startup.ts`).

Create new migrations using the migrate-mongo CLI:
```bash
npx migrate-mongo create my-migration-name
```

## Email — nunjucks-emailer

Email is handled by [nunjucks-emailer](https://www.npmjs.com/package/nunjucks-emailer) with Nunjucks HTML templates stored in `emails/templates/`.

Configuration is in `src/config.ts` under the `email` key. The emailer is initialised in `src/utils/startup.ts`.

| Variable | Description | Default |
|---|---|---|
| `EMAIL_MODE` | Send type (nodemailer, log, etc.) | `nodemailer` |
| `EMAIL_FALLBACK_FROM` | Default sender address | — |
| `EMAIL_HOST` | SMTP host | `smtp.sendgrid.net` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USERNAME` | SMTP user | — |
| `EMAIL_PASSWORD` | SMTP password | — |

Send emails via `src/services/email/Emailer.ts`:
```typescript
import Emailer from '@/services/email/Emailer';
await Emailer.send({
  to: { email: 'user@example.com', name: 'User' },
  subject: 'Welcome',
  tplRelativePath: 'welcome/newUser',
  tplObject: { name: 'User' },
});
```

## Permissions

### Route-level permissions via OpenAPI

Add `x-permission` to any path in your OpenAPI spec:
```yaml
x-permission: adminUsersDelete
```

The generated route will inject the `permissionMiddleware` before the domain is hit. Implement your permission logic in `src/services/PermissionService.ts`.

### Permission syncing

On startup, `src/utils/syncPermissions.ts` automatically:

1. Loads permissions from `src/constants/DEFAULT_PERMISSIONS.ts`
2. Inserts any missing permissions into the database
3. Extracts `x-permission` codes from the OpenAPI spec file
4. Inserts any new OpenAPI permissions not already tracked
5. Removes stale permissions no longer in the spec

On `local`/`develop` environments it also writes the current permission set back to `DEFAULT_PERMISSIONS.ts` to keep it in sync.

## Injecting into the http layer

Customise the http layer from `src/app.ts` by passing options to the `http()` call:

```typescript
import http, { Http } from '@/http';

export default async (port: number): Promise<Http> => {
  return http(port, {
    // Additional request middleware
    requestMiddleware: [
      rateLimiter,
    ],
    // Custom error handlers
    errorMiddleware: [
      customDbErrorHandler,
    ],
    // Custom error logging / hooks
    httpException: {
      errorHook: myErrorHook,
      errorLogger: myErrorLogger,
    },
  });
};
```

Builtin middleware options (helmet, access logger, etc.) are configured in `src/config.ts` under `appMiddlewareOptions`.

## OpenAPI spec helpers

These templates inject functionality into generated routes based on attributes in your OpenAPI spec.

### Access full request in domain

Use the generate-it core feature [pass-full-request-object-to-stub-method](https://acr-lfr.github.io/generate-it/#/_pages/features?id=pass-full-request-object-to-___stub-method). You can also get access to the response using `x-passResponse` — but you must manually complete the response (e.g. `res.json(...)`) or the call will hang.

### Allow non-authenticated requests — x-passThruWithoutJWT

Mark a route with `x-passThruWithoutJWT: true` to allow it through without a valid session. The domain will receive the user as `| undefined`:

```typescript
public async feedGet(
  jwtData: JwtAccess | undefined,
  // ...
): Promise<Feed> {
  // jwtData is undefined for unauthenticated requests
}
```

### Input/output validation

- **Input** — protected by [Celebrate](https://www.npmjs.com/package/celebrate) (Joi). Anything not declared in the spec results in a 422 error.
- **Output** — filtered by [object-reduce-by-map](https://www.npmjs.com/package/object-reduce-by-map), stripping undeclared attributes before they reach the client.

Inject Joi options per-path:
```yaml
x-joi-options:
  allowUnknown: true
```

### Async route validation — x-async-validators

For validation that requires async work (e.g. checking a database), add `x-async-validators` to your path:

```yaml
x-async-validators:
  - uniqueUsername
```

Implement the method in `src/services/AsyncValidationService.ts`:
```typescript
class AsyncValidationService {
  async uniqueUsername(req: NodegenRequest, asyncValidatorParams: string[]): Promise<void> {
    const user = await UserRepository.findByEmail(req.body.email);
    if (user) {
      throw http422();
    }
  }
}
```

Pass parameters with `:` separators: `uniqueEntry:user:username` — they arrive as `asyncValidatorParams[0]`, `asyncValidatorParams[1]`, etc.

### Inferring output content-type

The `inferResponseType` middleware selects the response `content-type` based on the client's `Accept` header and the OpenAPI `produces` definition. Fallback is `application/json`.

To return a file (e.g. PDF), return the absolute file path as a string from your domain — the middleware will call `res.download()` if the spec declares the matching content type.

### Caching — x-cache

Add `x-cache` to a path to inject the `CacheService` middleware before the domain. Implement your caching logic (e.g. Redis) in `src/services/CacheService.ts`.

### Raw body — x-raw-body

```yaml
x-raw-body: true
```

Disables validation, token checks, and body parsing for the path. The domain receives the raw body. Useful for third-party webhooks (e.g. Stripe).

### Errors

Throw HTTP errors from domains using the `Exception` classes in `src/http/nodegen/errors/`. Each has a corresponding error-handling middleware.

Use `src/services/HttpErrorsService.ts` to customise the error response format globally.

## CLI scripts

Run scripts with full access to the loaded app (database, services, etc.):

```bash
npm run cli-script -- seed-users
```

This calls `src/cli/run.ts` which executes the matching script from `src/cli/`. The app is initialised as normal but the script runs instead of starting the HTTP server. By default, CLI scripts will not run in production.

## Testing

The http layer is managed, so you can focus tests on domain logic. Auto-generate test stubs by adding to `.nodegenrc`:

```json
{
  "helpers": {
    "tests": {
      "outDir": "src/domains/__tests__"
    }
  }
}
```

Generated test helpers include a `mockAuth()` function that spies on `AccessTokenService.validateRequest` to bypass authentication during tests.

Run tests:
```bash
npm test           # lint + unit tests
npm run test:unit  # unit tests only
```

## Utilities

| Utility | Location | Description |
|---|---|---|
| **Event bus** | `src/utils/eventBus.ts` | Simple Node.js EventEmitter for in-process pub/sub |
| **JSON extractor** | `src/utils/jsonExtractor.ts` | Extracts JSON objects from strings (useful for parsing AI output) |
| **Time object** | `src/utils/timeObject.ts` | Time formatting helper |
| **toDecimal** | `src/utils/toDecimal.ts` | Number formatting helper |

## Setup

1. In a new directory, run `npm init`
2. Install generate-it: `npm i --save-dev openapi-nodegen`
3. Add a generate script to `package.json`:
   ```json
   "scripts": {
     "generate:nodegen": "openapi-nodegen ./api.yml -t https://github.com/<your-org>/generate-it-mono-express-mongo.git"
   }
   ```
4. Run generation: `npm run generate:nodegen`
5. Copy `.env.example` to `.env` and fill in your values
6. Install dependencies: `npm install`
7. Start development: `npm run dev:start`
