import * as request from 'request';
import * as moment from 'moment';
import * as redis from 'redis';

import { IItem, Item } from './item.model';

const API_URL = 'https://api.twitter.com/1.1/';
const AUTH_URL = 'https://api.twitter.com/oauth2/token';
const TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
const TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;

export class Twitter {
  private accessToken: string;

  constructor(private redis: redis.RedisClient) {}

  search(term: string, count: number = 25): Promise<IItem[]> {
    return new Promise( (resolve, reject) => {
      const url = API_URL + 'search/tweets.json?q=+exclude%3Aretweets%20' + encodeURIComponent(term) + '&count=' + count;
      this.redis.get(url, (error: any, reply: string) => {
        if (reply) {
          resolve(this.parseData(reply));
        } else {
          this.getAccessToken()
            .then( () => {
              request.get({
                url: url,
                headers: {
                  Authorization: 'Bearer ' + this.accessToken
                }
              }, (requestError: any, requestResponse: any, requestBody: any) => {
                if (!requestError && requestBody) {
                  this.redis.set(url, requestBody);
                  this.redis.expire(url, 60);
                  resolve(this.parseData(requestBody));
                } else {
                  reject(requestError);
                }
              });
            })
            .catch( () => {
              console.error('Could not get Twitter access token');
              reject();
            });
        }
      });
    });
  }

  private parseData(raw: any): IItem[] {
    let items = [];
    try {
      let data = JSON.parse(raw);
      for (const status of data.statuses) {
        items.push(new Item(
          parseInt(status.id, 10),
          moment(status.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').toDate(),
          (status.entities && status.entities.media && status.entities.media[0]) ? status.entities.media[0].media_url.replace(/^http:/, '') : null,
          'https://twitter.com/' + status.user.screen_name + '/status/' + status.id_str,
          status.text,
          status.user ? ('https://twitter.com/' + status.user.screen_name) : null,
          status.user ? status.user.name : null,
          status.user ? status.user.screen_name : null
        ));
      }
    } catch (err) {
      // Handle error
    }
    return items;
  }

  private getAccessToken(): Promise<any> {
    return new Promise( (resolve, reject) => {
      if (this.accessToken) {
        resolve();
      } else if (TWITTER_CONSUMER_KEY && TWITTER_CONSUMER_SECRET) {
        request.post({
          url: AUTH_URL,
          headers: {
            'Authorization': 'Basic ' + this.authHash(),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials'
        }, (error: any, response: any, body: any) => {
          this.accessToken = undefined;
          try {
            let data = JSON.parse(body);
            this.accessToken = data.access_token;
          } catch (err) {
            // Handle error
          }
          if (this.accessToken) {
            resolve();
          } else {
            reject();
          }
        });
      } else {
        reject();
      }
    });
  }

  private authHash(): string {
    return new Buffer(
      encodeURIComponent(TWITTER_CONSUMER_KEY)
      + ':'
      + encodeURIComponent(TWITTER_CONSUMER_SECRET)
    ).toString('base64');
  }
}
