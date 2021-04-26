const { ApolloServer } = require('apollo-server-express');
const { MongoClient } = require('mongodb');
const express = require('express');
const expressPlayground = require('graphql-playground-middleware-express').default;
const { readFileSync } = require('fs');
const typeDefs = readFileSync('./typeDefs.gql', 'utf-8');
const resolvers = require('./resolvers');


async function start() {
  const dbUrl = 'mongodb+srv://yaphtes:1111@sn-cluster.umvii.mongodb.net/sn-cluster?retryWrites=true&w=majority';
  const PORT = 4000;
  const client = await MongoClient.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  const db = client.db();
  const context = { db };
  const app = express();
  const server = new ApolloServer({ typeDefs, resolvers, context });
  
  server.applyMiddleware({ app });
  app.get('/', expressPlayground({ endpoint: '/graphql' }));
  app.listen({ port: PORT }, () => console.log(`GraphQL Server running @ http://localhost:${PORT}${server.graphqlPath}`));
}

start();
