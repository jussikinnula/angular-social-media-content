import * as path from 'path';
import * as moment from 'moment';
import * as express from 'express';
import * as serveStatic from 'serve-static';
import * as ejs from 'ejs';
import * as redis from 'redis';

import { Twitter } from './twitter.model';
import { Facebook, FACEBOOK_APP_ID } from './facebook.model';

// Environment
const PORT = process.env.PORT || 5000;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ExpressJS app
const app = express();
app.engine('html', ejs.renderFile);

// Redis
const client = redis.createClient(REDIS_URL);

// Development mode
if (process.env.NODE_ENV === 'development') {
  app.get('/facebook/auth', async (req, res) => {
    const token = await Facebook.getAccessToken(req.query.token);
    console.log(token);
    res.send({ token });
  });

  app.get('/facebook', (req, res) => {
    res.render(path.join(__dirname, './facebook.html'), { FACEBOOK_APP_ID });
  });
}

// Twitter REST API
const twitter = new Twitter(client);
app.get('/rest/twitter', async (req, res) => {
  const items = await twitter.search('angularfi');
  res.send({ items });
});

// Facebook REST API
const facebook = new Facebook(client);
app.get('/rest/facebook', async (req, res) => {
  const items = await facebook.page('angularfi');
  res.send({ items });
});

// Serve static files
app.use('/assets', serveStatic(path.join(__dirname, '../target/assets')));

// All other routes are handled by spa
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../target/index.html')));

// Server
const server = app.listen(PORT).on('listening', () => {
  console.log(`Listening on: http://localhost:${server.address().port}`);
});
