import axios from 'axios';
import log4js from 'log4js';
import { Song, Sheet } from './models';
import { hashed } from '../core/utils';

const logger = log4js.getLogger('ongeki/fetch-songs');
logger.level = log4js.levels.INFO;

const DATA_URL = 'https://ongeki.sega.jp/assets/json/music/music.json';
const IMAGE_BASE_URL = 'https://ongeki-net.com/ongeki-mobile/img/music/';

function extractCategory(rawSong: Record<string, any>) {
  if (rawSong.lunatic) return 'LUNATIC';
  if (rawSong.bonus) return 'ボーナストラック';
  return rawSong.category;
}

function extractSong(rawSong: Record<string, any>) {
  const imageUrl = new URL(rawSong.image_url, IMAGE_BASE_URL).toString();
  const imageName = `${hashed(imageUrl)}.png`;

  return {
    songId: rawSong.id,

    category: extractCategory(rawSong),
    title: rawSong.title,

    // titleKana: rawSong.title_sort,
    artist: rawSong.artist,

    imageName,
    imageUrl,

    version: null,
    releaseDate: rawSong.date ? `${
      rawSong.date.substring(0, 4)
    }-${
      rawSong.date.substring(4, 6)
    }-${
      rawSong.date.substring(6, 8)
    }` : null,

    isNew: !!rawSong.new,
  };
}

function extractSheets(rawSong: Record<string, any>) {
  return [
    { type: 'std', difficulty: 'basic', level: rawSong.lev_bas },
    { type: 'std', difficulty: 'advanced', level: rawSong.lev_adv },
    { type: 'std', difficulty: 'expert', level: rawSong.lev_exc },
    { type: 'std', difficulty: 'master', level: rawSong.lev_mas },
    { type: 'lun', difficulty: 'lunatic', level: rawSong.lev_lnt },
  ].filter((e) => !!e.level).map((rawSheet) => ({
    songId: rawSong.id,
    category: extractCategory(rawSong),
    title: rawSong.title,
    ...rawSheet,
  }));
}

export default async function run() {
  logger.info(`Fetching data from: ${DATA_URL} ...`);
  const response = await axios.get(DATA_URL);

  const rawSongs: Record<string, any>[] = response.data;
  logger.info(`OK, ${rawSongs.length} songs fetched.`);

  rawSongs.reverse();

  logger.info('Preparing Songs table ...');
  await Song.sync();

  logger.info('Preparing Sheets table ...');
  await Sheet.sync();

  logger.info('Updating songs ...');
  const songs = rawSongs.map((rawSong) => extractSong(rawSong));
  await Promise.all(songs.map((song) => Song.upsert(song)));

  logger.info('Updating sheets ...');
  const sheets = rawSongs.flatMap((rawSong) => extractSheets(rawSong));
  await Promise.all(sheets.map((sheet) => Sheet.upsert(sheet)));

  logger.info('Done!');
}

if (require.main === module) run();