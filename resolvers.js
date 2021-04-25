const { GraphQLScalarType } = require('graphql');
const { photos, users, tags } = require('./db');
const { v4: uuid } = require('uuid');


module.exports = {
  Query: {
    totalPhotos: () => photos.length,
    allPhotos: (parent, args) => {
      const getMs = value => Number(new Date(value));
      return args.after ?
        photos.filter(photo => getMs(photo.created) >= getMs(args.after))
        :
        photos;
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
    url: parent => `TODO generate url for images by id: ${parent.id}`,
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
