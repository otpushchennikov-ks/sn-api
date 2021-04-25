const { ApolloServer } = require('apollo-server');
const { GraphQLScalarType} = require('graphql');
const { v4: uuid } = require('uuid');
let serverURL = '';


const users = [
  { githubLogin : 'mHattrup', name: 'MikeHattrup' },
  { githubLogin: 'gPlake', name: 'Glen Plake' },
  { githubLogin: 'sSchmidt', name: 'Scot Schmidt' },
];

const photos = [
  {
    id: '1',
    name : 'Dropping the Heart Chute',
    description: 'The Heart chute is one of my favorite chutes',
    category: 'ACTION',
    githubUser: 'gPlake',
    created: '3-28-1977',
  },
  {
    id: '2',
    name : 'Enjoying the sunshine',
    category: 'SELFIE',
    githubUser: 'sSchmidt',
    created: '1-2-1985',
  },
  {
    id: '3',
    name : 'Gunbarrel 25',
    description: '25 laps on gunbarrel today',
    category: 'LANDSCAPE',
    githubUser: 'sSchmidt',
    created: '2018-04-15T19:09:57.308Z',
  },
];

const tags = [
  { photoId: '1', userId: 'gPlake' },
  { photoId: '2', userId: 'sSchmidt' },
  { photoId: '2', userId: 'mHattrup' },
  { photoId: '2', userId: 'gPlake' },
];

const typeDefs = `
  scalar DateTime

  type Photo {
    id: ID!
    created: DateTime!
    category: PhotoCategory!
    url: String!
    name: String!
    description: String
    postedBy: User!
    githubUser: String!
    taggedUsers: [User!]!
  }

  enum PhotoCategory {
    SELFIE
    PORTRAIT
    ACTION
    LANDSCAPE
    GRAPHIC
  }

  input PostPhotoInput {
    name: String!
    category: PhotoCategory=PORTRAIT
    description: String
  }

  type User {
    githubLogin: ID!
    name: String
    avatar: String
    postedPhotos: [Photo!]!
    inPhotos: [Photo!]!
  }

  type Query {
    totalPhotos: Int!
    allPhotos(after: DateTime): [Photo!]!
    totalUsers: Int!
    allUsers: [User!]!
  }

  type Mutation {
    postPhoto(input: PostPhotoInput!): Photo!
  }
`;

const resolvers = {
  Query: {
    totalPhotos: () => photos.length,
    allPhotos: (parent, args) => {
      const getMs = value => Number(new Date(value));
      return photos.filter(photo => getMs(photo.created) >= getMs(args.after));
    },
    totalUsers: () => users.length,
    allUsers: () => users,
  },
  Mutation: {
    postPhoto(parent, args) {
      const nextPhoto = {
        id: uuid(),
        ...args.input,
        created: new Date(),
      };

      photos.push(nextPhoto);

      return nextPhoto;
    },
  },
  Photo: {
    url: parent => serverURL + 'img/' + parent.id + '.jpeg',
    postedBy: parent => {
      return users.find(user => user.githubLogin === parent.githubUser);
    },
    taggedUsers: parent => {
      return tags
        .filter(tag => tag.photoId === parent.id)
        .map(tag => tag.userId)
        .map(userId => users.find(user => user.githubLogin === userId));
    },
  },
  User: {
    postedPhotos: parent => {
      return photos.filter(photo => photo.githubUser === parent.githubLogin);
    },
    inPhotos: parent => {
      return tags
        .filter(tag => tag.userId === parent.githubLogin)
        .map(tag => tag.photoId)
        .map(photoId => photos.find(photo => photo.id === photoId));
    },
  },
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'A valid date time value.',
    parseValue: value => new Date(value),
    parseLiteral: ast => ast.value,
    serialize: value => new Date(value).toISOString(),
  }),
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server
  .listen()
  .then(({ url }) => {
    serverURL = url;
    console.log(`GraphQL server running on ${url}`);
  });
