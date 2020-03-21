
const uuid =require('uuid/v4');
const bcrypt = require('bcrypt');

const resolvers = {
  Query: {
    currentUser: (parent, args, context) => context.getUser(),
  },
  Mutation: {
    signup: async (parent, {name, email, password }, context) => {
        const existingUser = await context.User.find({email});
        console.log(existingUser)
        if (existingUser.length>0) {
        throw new Error('User with email already exists');
        }

        const hashedPw = await bcrypt.hash(password, 12);
        newUser = new context.User({            
            email,
            name,
            password: hashedPw,
            name
        });
        await newUser.save()
        await context.login(newUser);

        return { user: newUser };
    },
    login: async (parent, { email, password }, context) => {
      const { user } = await context.authenticate('graphql-local', { email, password });
      await context.login(user);
      return { user }
    },
    logout: (parent, args, context) => context.logout(),
  },
};

module.exports = resolvers;