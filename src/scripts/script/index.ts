import Debug from 'debug';

const debug = Debug('scripts');

export const handler = async () => {
  debug('Working...');

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
};
