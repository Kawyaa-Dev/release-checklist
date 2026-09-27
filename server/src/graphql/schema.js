export const typeDefs = `#graphql
  enum Status {
    planned
    ongoing
    done
  }

  type Step {
    key: String!
    label: String!
    completed: Boolean!
  }

  type Release {
    id: ID!
    name: String!
    date: String!
    additionalInfo: String
    status: Status!
    steps: [Step!]!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    releases: [Release!]!
    release(id: ID!): Release
  }

  type Mutation {
    createRelease(name: String!, date: String!, additionalInfo: String): Release!
    toggleStep(releaseId: ID!, stepKey: String!): Release!
    updateReleaseInfo(id: ID!, additionalInfo: String): Release!
    deleteRelease(id: ID!): Boolean!
  }
`;