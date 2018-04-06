const fs = require('fs');
const axios = require('axios');

function callAPI(method, args) {
  return axios.get(`https://api.vk.com/method/${method}`, {
    params: {
      v: process.env.API_VERSION || '5.74',
      ...args
    }
  });
}

async function download(url, path) {
  const { data } = await axios({
    method: 'get',
    url,
    responseType: 'stream'
  });

  data.pipe(fs.createWriteStream(path));

  return new Promise((resolve, reject) => {
    data.on('end', resolve);
    data.on('error', reject);
  });
}

const unixToISO = unixtime => new Date(unixtime * 1000).toISOString();
const hasProp = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

module.exports = {
  callAPI,
  download,
  hasProp,
  unixToISO
};
