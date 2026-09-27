import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/graphql";

const httpLink = new HttpLink({ uri: API_URL });

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          releases: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});
