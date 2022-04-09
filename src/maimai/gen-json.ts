/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import fs from 'fs';
import log4js from 'log4js';
import { QueryTypes } from 'sequelize';
import { sequelize } from './models';

const logger = log4js.getLogger('maimai/gen-json');
logger.level = log4js.levels.INFO;

const DIST_PATH = 'dist/maimai';

const versionMappingList = [
  { version: 'maimai', abbr: 'maimai' },
  { version: 'maimai PLUS', abbr: 'maimai+' },
  { version: 'GreeN', abbr: 'GreeN' },
  { version: 'GreeN PLUS', abbr: 'GreeN+' },
  { version: 'ORANGE', abbr: 'ORANGE' },
  { version: 'ORANGE PLUS', abbr: 'ORANGE+' },
  { version: 'PiNK', abbr: 'PiNK' },
  { version: 'PiNK PLUS', abbr: 'PiNK+' },
  { version: 'MURASAKi', abbr: 'MURASAKi' },
  { version: 'MURASAKi PLUS', abbr: 'MURASAKi+' },
  { version: 'MiLK', abbr: 'MiLK' },
  { version: 'MiLK PLUS', abbr: 'MiLK+' },
  { version: 'FiNALE', abbr: 'FiNALE' },
  { version: 'maimaiでらっくす', abbr: 'でらっくす' },
  { version: 'maimaiでらっくす PLUS', abbr: 'でらっくす+' },
  { version: 'Splash', abbr: 'Splash' },
  { version: 'Splash PLUS', abbr: 'Splash+' },
  { version: 'UNiVERSE', abbr: 'UNiVERSE' },
  { version: 'UNiVERSE PLUS', abbr: 'UNiVERSE+' },
  //! add further version here !//
];
const typeMappingList = [
  { type: 'std', name: 'STD（スタンダード）', abbr: 'STD', iconUrl: '/img/maimai/music_standard.png' },
  { type: 'dx', name: 'DX（でらっくす）', abbr: 'DX', iconUrl: '/img/maimai/music_dx.png' },
];
const difficultyMappingList = [
  { difficulty: 'basic', name: 'BASIC', color: 'lime' },
  { difficulty: 'advanced', name: 'ADVANCED', color: 'orange' },
  { difficulty: 'expert', name: 'EXPERT', color: 'red' },
  { difficulty: 'master', name: 'MASTER', color: 'darkorchid' },
  { difficulty: 'remaster', name: 'Re:MASTER', color: 'cyan' },
];
const regionMappingList = [
  { regionCode: 'intl' },
  { regionCode: 'cn' },
];

export default async function run() {
  const levelMappings = new Map();

  logger.info('Loading songs and extras from database ...');
  const songs: any[] = await sequelize.query(/* sql */ `
    SELECT
      *
    FROM "Songs"
      NATURAL LEFT JOIN "SongExtras"
  `, {
    type: QueryTypes.SELECT,
  });

  logger.info('Loading sheets and extras from database ...');
  for (const song of songs) {
    const sheetsOfSong: any[] = await sequelize.query(/* sql */ `
      SELECT
        *,
        "JpSheets"."title" IS NOT NULL AS "isJpIncluded",
        "IntlSheets"."title" IS NOT NULL AS "isIntlIncluded",
        "CnSheets"."title" IS NOT NULL AS "isCnIncluded"
      FROM "Sheets"
        NATURAL LEFT JOIN "SheetVersions"
        NATURAL LEFT JOIN "SheetExtras"
        NATURAL LEFT JOIN "JpSheets"
        NATURAL LEFT JOIN "IntlSheets"
        NATURAL LEFT JOIN "CnSheets"
      WHERE "category" = :category AND "title" = :title
    `, {
      type: QueryTypes.SELECT,
      replacements: {
        category: song.category,
        title: song.title,
      },
    });

    for (const sheet of sheetsOfSong) {
      delete sheet.category;
      delete sheet.title;

      sheet.levelValue = Number(sheet.level.replace('+', '.5'));
      levelMappings.set(sheet.levelValue, sheet.level);

      sheet.regions = {
        jp: Boolean(sheet.isJpIncluded),
        intl: Boolean(sheet.isIntlIncluded),
        cn: Boolean(sheet.isCnIncluded),
      };
      delete sheet.isJpIncluded;
      delete sheet.isIntlIncluded;
      delete sheet.isCnIncluded;

      sheet.noteCounts = {
        tap: sheet.tapCount,
        hold: sheet.holdCount,
        slide: sheet.slideCount,
        touch: sheet.touchCount,
        break: sheet.breakCount,
        total: sheet.totalCount,
      };
      delete sheet.tapCount;
      delete sheet.holdCount;
      delete sheet.slideCount;
      delete sheet.touchCount;
      delete sheet.breakCount;
      delete sheet.totalCount;
    }

    delete song.imageUrl;
    song.sheets = sheetsOfSong;
    song.isNew = Boolean(song.isNew);
    song.isLocked = Boolean(song.isLocked);
  }

  songs.reverse();

  const levels = (
    [...levelMappings.entries()]
      .sort(([aLevelValue], [bLevelValue]) => aLevelValue - bLevelValue)
      .map(([levelValue, level]) => ({ levelValue, level }))
  );

  const output = {
    songs,
    levels,
    versions: versionMappingList,
    types: typeMappingList,
    difficulties: difficultyMappingList,
    regions: regionMappingList,
    updateTime: Date.now(),
  };

  logger.info(`Writing output into ${DIST_PATH}/data.json ...`);
  fs.mkdirSync(DIST_PATH, { recursive: true });
  fs.writeFileSync(`${DIST_PATH}/data.json`, JSON.stringify(output, null, '\t'));

  logger.info('Done!');
}

if (require.main === module) run();
