import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  Observable,
  split,
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { ErrorLink } from '@apollo/client/link/error';
import { authService } from '../services/auth/AuthService';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

// --- Types ---

interface FormattedExecutionResult {
  errors?: ReadonlyArray<GraphQLFormattedError>;
  data?: Record<string, unknown> | null;
  extensions?: Record<string, unknown>;
}

interface ServerError extends Error {
  statusCode: number;
  result: Record<string, unknown>;
  response: Response;
}

interface ErrorResponse {
  graphQLErrors?: ReadonlyArray<GraphQLError>;
  networkError?: Error | ServerError | null;
  operation: ApolloLink.Operation;
  forward: (op: ApolloLink.Operation) => Observable<FormattedExecutionResult>;
}

// --- Token Refresh Queue Utility ---

class TokenRefreshQueue {
  private isRefreshing = false;
  private pendingRequests: (() => void)[] = [];

  public get refreshing() {
    return this.isRefreshing;
  }

  public enqueue(callback: () => void) {
    this.pendingRequests.push(callback);
  }

  public processQueue() {
    this.pendingRequests.forEach((callback) => callback());
    this.pendingRequests = [];
  }

  public clear() {
    this.pendingRequests = [];
  }

  public async startRefresh(): Promise<boolean> {
    if (this.isRefreshing) return false;
    this.isRefreshing = true;

    try {
      const success = await authService.refreshToken();
      this.isRefreshing = false;
      if (success) {
        this.processQueue();
        return true;
      } else {
        this.clear();
        return false;
      }
    } catch (err) {
      this.isRefreshing = false;
      this.clear();
      throw err;
    }
  }
}

const refreshQueue = new TokenRefreshQueue();

// --- Helpers ---

function isServerError(error: Error | null | undefined): error is ServerError {
  return error !== null && error !== undefined && 'statusCode' in error;
}

// Checks for both Transport-level 401s (Middleware) and GraphQ-level errors (Resolvers)
function isUnauthenticatedError(
  graphQLErrors: ReadonlyArray<GraphQLError> | undefined,
  networkError: Error | null | undefined
): boolean {
  // 1. GraphQL Error: Resolver rejected the request (status often 200 OK)
  const hasAuthErrorCode = graphQLErrors?.some(
    (err) => err.extensions?.code === 'UNAUTHENTICATED' || err.extensions?.code === 'UNAUTHORIZED'
  );

  // 2. Network Error: Middleware/Gateway rejected request before execution (status 401)
  const hasAuthStatus = isServerError(networkError) && networkError.statusCode === 401;

  return !!(hasAuthErrorCode || hasAuthStatus);
}

// --- Links ---
const errorLink = new ErrorLink(
  ({ graphQLErrors, networkError, operation, forward }: ErrorResponse) => {
    if (isUnauthenticatedError(graphQLErrors, networkError)) {
      if (!authService.getUser()) {
        authService.logout(false);
        return;
      }

      if (refreshQueue.refreshing) {
        return new Observable<FormattedExecutionResult>((observer) => {
          refreshQueue.enqueue(() => {
            const subscriber = {
              next: (v: FormattedExecutionResult) => observer.next(v),
              error: (e: unknown) => observer.error(e),
              complete: () => observer.complete(),
            };
            forward(operation).subscribe(subscriber);
          });
        });
      }

      return new Observable<FormattedExecutionResult>((observer) => {
        refreshQueue
          .startRefresh()
          .then((success) => {
            if (success) {
              const subscriber = {
                next: (v: FormattedExecutionResult) => observer.next(v),
                error: (e: unknown) => observer.error(e),
                complete: () => observer.complete(),
              };
              forward(operation).subscribe(subscriber);
            } else {
              authService.logout(false);
              observer.error(new Error('Session expired'));
            }
          })
          .catch((err) => {
            authService.logout(false);
            observer.error(err);
          });
      });
    }

    return;
  }
);

const httpLink = new HttpLink({
  uri: 'http://localhost:8080/query',
  credentials: 'include',
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:8080/query',
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  link: ApolloLink.from([errorLink, splitLink]),
  cache: new InMemoryCache(),
});
