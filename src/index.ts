import express, { Request } from 'express';
import { config } from 'aws-sdk';
import QueryString from 'qs';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import cors from 'cors';
import Debug from 'debug';

import { api } from './api';

const debugApp = Debug('app');
const debugError = Debug('error');

debugApp('****');
debugApp('Initializing development server...');
debugApp('****');

const configurationFilePath = resolve(__dirname, 'config.json');

if (!existsSync(configurationFilePath)) {
  debugError('Missing AWS Configuration file');

  process.exit(1);
}

config.loadFromPath(configurationFilePath);

const app = express();

app.use(express.json());
app.use(cors());

const expressToLambda = (
  req: Request<any, any, any, QueryString.ParsedQs, Record<string, any>>,
) => {
  return {
    body: JSON.stringify(req.body),
    path: req.path,
    httpMethod: req.method,
    queryStringParameters: req.query,
    headers: req.headers,
  };
};

app.all('*', async (req, res) => {
  const { path, method } = req;

  const route = api.find(r => r.path === path && r.method === method);

  if (!route) {
    return res.status(404).json({ message: `${method} ${path} not found` });
  }

  try {
    const { handler } = await import(
      resolve(__dirname, 'scripts', route.directory, 'index')
    );

    const result = await handler(expressToLambda(req));

    return res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    if (error instanceof Error) return res.status(500).send(error.message);

    return res.status(500).send('Unknown error');
  }
});

const port = 3303;

app.listen(port, () => {
  debugApp(`Server started at http://localhost:${port}`);
});
