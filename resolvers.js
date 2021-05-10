const { GraphQLScalarType } = require('graphql');
const { authorizeWithGithub, generateAuthorizationError } = require('./lib');
const { default: axios } = require('axios');
const { isAfter } = require('date-fns');

 
module.exports = {
  Query: {
    me: (parent, args, context) => context.currentUser,
    totalPhotos: (parent, arga, context) => context.db.collection('photos').countDocuments(),
    allPhotos: async (parent, args, context) => {
      const photos = await context.db
        .collection('photos')
        .find()
        .toArray();

      // TODO: реализовать эту фильтрацию на стороне БД
      return args.after ?
        photos.filter(photo => isAfter(new Date(photo.created), new Date(args.after)))
        :
        photos;
    },
    totalUsers: (parent, args, context) => context.db.collection('users').countDocuments(),
    allUsers: async (parent, args, context) => {
      const users = await context.db
        .collection('users')
        .find()
        .toArray();

      // TODO: реализовать эту фильтрацию на стороне БД
      return !args.name ? users : users.filter(({ name }) => {
        return name.toLowerCase().includes(args.name.toLowerCase());
      });
    },
  },
  Mutation: {
    async postPhoto(parent, args, context) {
      if (!context.currentUser) {
        return generateAuthorizationError();
      }

      const nextPhoto = {
        ...args.input,
        postedByLogin: context.currentUser.githubLogin,
        created: new Date(),
      };

      const { ops: [{ _id }]} = await context.db
        .collection('photos')
        .insertOne(nextPhoto);

      return {
        ...nextPhoto,
        id: _id,
      };
    },
    async githubAuth(parent, args, context) {
      const {
        message,
        token,
        login,
        name,
        avatar_url,
      } = await authorizeWithGithub({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: args.code,
      });

      if (message) {
        throw new Error(message);
      }

      const latestUserInfo = {
        name,
        githubLogin: login,
        githubToken: token,
        avatar: avatar_url,
      };

      const { ops: [user] } = await context.db
        .collection('users')
        .replaceOne({ githubLogin: login }, latestUserInfo, { upsert: true });

      return {
        user,
        token,
      };
    },
    addFakeUsers: async (parent, args, context) => {
      const randomUserApi = `https://randomuser.me/api/?results=${args.count}`;
      const { results } = await axios.get(randomUserApi).then(res => res.data);

      const users = results.map(result => ({
        githubLogin: result.login.username,
        name: `${result.name.first} ${result.name.last}`,
        avatar: result.picture.thumbnail,
        githubToken: result.login.sha1,
      }));

      await context.db.collection('users').insertMany(users);

      return users;
    },
    fakeUserAuth: async (parent, args, context) => {
      const user = await context.db
        .collection('users')
        .findOne({ githubLogin: args.githubLogin });
      
      return {
        token: user?.githubToken ?? null,
        user,
      };
    },
  },
  Photo: {
    id: parent => parent._id,
    url: parent => `http://localhost:4000/img/${parent.id}.jpg`,
    postedBy: async (parent, args, context) => {
      return await context.db
        .collection('users')
        .findOne({ githubLogin: parent.postedByLogin });
    },
    // TODO: связь многие ко многим
    // taggedUsers: () => {},
  },
  User: {
    postedPhotos: (parent, args, context) => {
      return context.db
        .collection('photos')
        .find({ postedByLogin: parent.githubLogin })
        .toArray();
    },
    // TODO: связь многие ко многим
    // inPhotos: () => {},
  },
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'A valid date time value.',
    parseValue: value => new Date(value),
    parseLiteral: ast => ast.value,
    serialize: value => new Date(value).toISOString(),
  }),
};
