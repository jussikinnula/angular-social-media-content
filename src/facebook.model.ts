import * as request from 'request';
import * as moment from 'moment';
import * as redis from 'redis';

import { IItem, Item } from './item.model';

const API_URL = 'https://graph.facebook.com';
export const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

export class Facebook {
  constructor(private redis: redis.RedisClient) {}

  page(term: string, count: number = 25): Promise<IItem[]> {
    return new Promise( (resolve, reject) => {
      const url = `${API_URL}/v2.11/${term}/feed`;
      this.redis.get(url, (error: any, reply: string) => {
        if (reply) {
          resolve(this.parseData(reply));
        } else {
          request(
            url + '?access_token=' + FACEBOOK_ACCESS_TOKEN,
            (requestError: any, requestResponse: any, requestBody: any) => {
              if (!requestError && requestBody) {
                this.redis.set(url, requestBody);
                this.redis.expire(url, 60);
                resolve(this.parseData(requestBody));
              } else {
                reject(requestError);
              }
            }
          );
        }
      });
    });
  }

  private parseData(raw: any): IItem[] {
    let items = [];
    try {
      let data = JSON.parse(raw);
      for (const post of data.data) {
        items.push(new Item(
          parseInt(post.id, 10),
          moment(post.created_time).toDate(),
          null, // add pic later
          'https://www.facebook.com/' + post.id,
          post.message,
          null, // add user link later
          null, // add user name later
          null, // add user screen name later
        ));
      }
    } catch (err) {
      // Handle error
    }
    return items;
  }

  static getAccessToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = `${API_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${token}`;
      request(url, (error: any, response: any, body: any) => {
        try {
          const data = JSON.parse(body);
          resolve(data.access_token);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}
