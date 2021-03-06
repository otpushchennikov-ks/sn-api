const { ApolloServer } = require('apollo-server-express');
const { MongoClient } = require('mongodb');
const express = require('express');
const expressPlayground = require('graphql-playground-middleware-express').default;
const { readFileSync } = require('fs');
const typeDefs = readFileSync('./typeDefs.gql', 'utf-8');
const resolvers = require('./resolvers');
const { decryptGithubToken } = require('./lib');
require('dotenv').config();


async function start() {
  const dbUrl = process.env.DB_HOST;
  const PORT = process.env.PORT;
  const client = await MongoClient.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db();
  const app = express();
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const githubToken = req.headers['github-token'] ?? '';
      const originalGithubToken = decryptGithubToken(githubToken);

      const currentUser = await db
        .collection('users')
        .findOne({ githubToken: originalGithubToken });
      
      return { db, currentUser };
    },
  });
  
  server.applyMiddleware({ app, cors: { credentials: true, origin: true }});
  app.get('/', expressPlayground({ endpoint: '/graphql' }));
  app.listen({ port: PORT }, () => console.log(`GraphQL Server running @ http://localhost:${PORT}${server.graphqlPath}`));
}

start();
