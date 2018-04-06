const fs = require('fs');
const { ExifTool } = require('exiftool-vendored');
const { hasProp, callAPI, download, unixToISO } = require('./utils');

const exiftool = new ExifTool();

function getOriginalLink(photo) {
  const sizes = Object.keys(photo)
    .filter(key => key.startsWith('photo_'))
    .map(key => parseInt(key.slice(6)));

  return photo[`photo_${Math.max(...sizes)}`];
}

function downloadAlbum({ id, title, owner_id }) {
  fs.mkdirSync(`./photos/${title}`);

  callAPI('photos.get', { album_id: id, owner_id }).then(({ data }) => {
    data.response.items.forEach(photo => {
      const link = getOriginalLink(photo);
      const path = `./photos/${title}/${photo.id}.jpg`;

      const geo =
        hasProp(photo, 'lat') && hasProp(photo, 'long')
          ? {
              GPSLatitude: photo.lat,
              GPSLatitudeRef: 'N',
              GPSLongitude: photo.long,
              GPSLongitudeRef: 'E'
            }
          : {};

      download(link, path).then(() => {
        exiftool.write(path, { AllDates: unixToISO(photo.date), ...geo });
      });
    });
  });
}

fs.mkdirSync('./photos');

callAPI('users.get', { user_ids: process.env.USER_ID })
  .then(({ data }) => callAPI('photos.getAlbums', { owner_id: data.response[0].id }))
  .then(({ data }) => {
    data.response.items.forEach(downloadAlbum);
  });
