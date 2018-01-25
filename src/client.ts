// Angular
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Component, OnInit, ElementRef, ViewChild, NgModule } from '@angular/core';
import { BrowserModule  } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

// Interfaces
import { IItem, Item } from './item.model';

// Zone.js
import 'zone.js/dist/zone';

// Reflect metadata
import 'reflect-metadata';

// Production mode
if (process.env.NODE_ENV === 'production') {
  enableProdMode();
  Error['stackTraceLimit'] = Infinity;
  require('zone.js/dist/long-stack-trace-zone');
}

// AppComponent
@Component({
  selector: 'body',
  template: `
    <h1>Angular Social Media Content</h1>
    <h2>Twitter</h2>
    <ul>
      <li *ngFor="let item of twitterItems">{{item.message}}</li>
    </ul>
    <h2>Facebook</h2>
    <ul>
      <li *ngFor="let item of facebookItems">{{item.message}}</li>
    </ul>
  `,
  styles: [`
    :host {
      padding: 0;
      margin: 0;
    }

  `]
})
class AppComponent implements OnInit {
  twitterItems: IItem[] = [];  
  facebookItems: IItem[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get('/rest/twitter').subscribe(data => this.twitterItems = this.parseItems(data));    
    this.http.get('/rest/facebook').subscribe(data => this.facebookItems = this.parseItems(data));    
  }

  private parseItems(data: any): IItem[] {
    return data['items'].map(item => Item.fromItem(item));
  }
}

// AppModule
@NgModule({
  imports: [BrowserModule, CommonModule, FormsModule, HttpClientModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
class AppModule {}

// Bootstrapo
platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.log(err));
