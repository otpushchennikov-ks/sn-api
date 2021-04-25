const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const expressPlayground = require('graphql-playground-middleware-express').default;
const { readFileSync } = require('fs');
const typeDefs = readFileSync('./typeDefs.gql', 'utf-8');
const resolvers = require('./resolvers');


const PORT = 4000;
const app = express();
const server = new ApolloServer({ typeDefs, resolvers });

server.applyMiddleware({ app });
app.get('/', expressPlayground({ endpoint: '/graphql' }));
app.listen({ port: PORT }, () => console.log(`GraphQL Server running @ http://localhost:${PORT}${server.graphqlPath}`));
