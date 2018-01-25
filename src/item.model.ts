import * as moment from 'moment';

export interface IItem {
  id: number;
  created: Date;
  image?: string;
  link?: string;
  message: string;
  userLink?: string;
  userName?: string;
  userScreenName?: string;
}

export class Item implements IItem {
  created: Date;

  constructor(
    public id: number,
    created: Date,
    public image: string,
    public link: string,
    public message: string,
    public userLink: string,
    public userName: string,
    public userScreenName: string
  ) {
    if (created instanceof Date) {
      this.created = created;
    } else {
      this.created = moment(created).toDate();
    }
  }

  static fromItem(item: any) {
    return new Item(
      item.id,
      item.created,
      item.image,
      item.link,
      item.message,
      item.userLink,
      item.userName,
      item.userScreenName
    );
  }
}
