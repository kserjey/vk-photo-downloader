const fs = require('fs');
const axios = require('axios');
const { ExifTool } = require('exiftool-vendored');

const exiftool = new ExifTool();

function callAPI(method, args) {
  return axios.get(`https://api.vk.com/method/${method}`, {
    params: {
      v: process.env.API_VERSION,
      ...args
    }
  });
}

async function downloadImage(url, path, { date, long, lat }) {
  const { data } = await axios({
    method: 'get',
    url,
    responseType: 'stream'
  });

  data.pipe(
    fs.createWriteStream(path).on('finish', () => {
      exiftool.write(path, { AllDates: date, GPSLongitude: long, GPSLatitude: lat });
    })
  );
}

const unixToISO = unixtime => new Date(unixtime * 1000).toISOString();

function downloadAlbum({ id, title, owner_id }) {
  fs.mkdirSync(`./tmp/${title}`);

  callAPI('photos.get', { album_id: id, owner_id }).then(({ data }) => {
    data.response.items.forEach(photo => {
      const srcKeys = Object.keys(photo).filter(key => key.startsWith('photo_'));
      const srcSizes = srcKeys.map(key => parseInt(key.slice(6)));
      const maxSize = Math.max(...srcSizes);
      downloadImage(photo[`photo_${maxSize}`], `./tmp/${title}/${photo.id}.jpg`, {
        ...photo,
        date: unixToISO(photo.date)
      });
    });
  });
}

callAPI('users.get', { user_ids: process.env.USER_ID })
  .then(({ data }) => callAPI('photos.getAlbums', { owner_id: data.response[0].id }))
  .then(({ data }) => {
    data.response.items.forEach(downloadAlbum);
  });
