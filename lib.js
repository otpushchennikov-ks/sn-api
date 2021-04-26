const axios = require('axios').default;


const getGithubToken = credentials => {
  return axios.post('https://github.com/login/oauth/access_token?scope=user', credentials, {
    headers: { 'Accept': 'application/json' },
  })
    .then(res => res.data.access_token)
    .catch(console.error);
};

const getGithubUserAccount = token => {
  return axios.get(`https://api.github.com/user`, {
    headers: { 'Authorization': 'token ' + token },
  })
    .then(res => res.data)
    .catch(console.error);
};

exports.authorizeWithGithub = async credentials => {
  const token = await getGithubToken(credentials);
  const githubUser = await getGithubUserAccount(token);
  return { ...githubUser, token };
};
