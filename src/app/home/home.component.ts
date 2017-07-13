import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DataService } from '../data.service';
import { IPost } from '../../api/dataController';

@Component({
  selector: 'abode-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  lastAte: IPost;
  lastDrank: IPost;
  lastSeen: IPost;

  constructor(meta: Meta, title: Title, private _dataService: DataService) {

    this._dataService.getPosts({
      limit: 1,
      types: ['Ate']
    }).subscribe(
        posts => {this.lastAte = posts[0]},
        error => {console.log(error)}
    );

    this._dataService.getPosts({
      limit: 1,
      types: ['Drank']
    }).subscribe(
        posts => {this.lastDrank = posts[0]},
        error => {console.log(error)}
    );

    this._dataService.getPosts({
      limit: 1,
      types: ['Checkin']
    }).subscribe(
        posts => {
          console.log('Fetched Checkin');
          console.log(posts[0]);
          this.lastSeen = posts[0];
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

}
