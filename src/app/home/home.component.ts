import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DataService, IPost } from '../data.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  lastAte: IPost;
  lastDrank: IPost;
  lastSeen: IPost;
  lastSeenMapUrl: String;

  constructor(meta: Meta, title: Title, private _dataService: DataService) {

    this._dataService.getPosts({
      count: 1,
      types: ['Ate']
    }).subscribe(
        posts => {this.lastAte = posts[0]},
        error => {console.log(error)}
    );

    this._dataService.getPosts({
      count: 1,
      types: ['Drank']
    }).subscribe(
        posts => {this.lastDrank = posts[0]},
        error => {console.log(error)}
    );

    this._dataService.getPosts({
      count: 1,
      types: ['Checkin']
    }).subscribe(
        posts => {
          this.lastSeen = posts[0];
          this.lastSeenMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v9/static/pin-m+24b1f3(${this.lastSeen.properties.checkin.properties.longitude},${this.lastSeen.properties.checkin.properties.latitude})/${this.lastSeen.properties.checkin.properties.longitude},${this.lastSeen.properties.checkin.properties.latitude},1,0,60/592x211@2x?access_token=pk.eyJ1IjoiZWRkaWVoaW5rbGUiLCJhIjoiY2oxa3o1aXdiMDAwNDMzbjFjNGQ0ejl1eSJ9.WQZ6i6b-TYYe_96IQ6iXdg&attribution=false&logo=false`;
        },
        error => {console.log(error)}
    );

    title.setTitle('Eddie Hinkle');

    meta.addTags([
      { name: 'author',   content: 'Eddie Hinkle'},
      { name: 'keywords', content: 'eddie, hinkle, software engineer, programming, blog, faith, christianity'},
      { name: 'description', content: 'This is the description of my site!' }
    ]);

  }

  ngOnInit() {
  }

  getMapImage() {
    return this.lastSeenMapUrl;
  }

}
