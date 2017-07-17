import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { DataService } from '../data.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import { IPost } from '../../api/dataController';
import * as mf2 from '../../api/mf2';

@Component({
  selector: 'abode-on-this-day',
  templateUrl: './on-this-day.component.html',
  styleUrls: ['./on-this-day.component.css']
})
export class OnThisDayComponent implements OnInit {

  currentYear: number;
  currentMonth: number;
  currentDay: number;

  posts: PostYearCollection[];
  errorMessage: string = undefined;

  constructor(private router: Router, private route: ActivatedRoute, private _dataService: DataService, meta: Meta, title: Title) {
    this.currentMonth = route.snapshot.params['month'] || moment().format('M');
    this.currentDay = route.snapshot.params['day'] || moment().format('DD');
    this.currentYear = <number><any>moment().format('YYYY');

    title.setTitle('On This Day - Eddie Hinkle');

    meta.addTags([
      { name: 'author',   content: 'Eddie Hinkle'},
      { name: 'keywords', content: 'eddie, hinkle, software engineer, programming, blog, faith, christianity'},
      { name: 'description', content: 'On This Day' }
    ]);
  }

  ngOnInit() {
    this.getPosts()
  }

  getPosts() {

    this._dataService.getPostOnThisDay(
      this.currentYear,
      this.currentMonth,
      this.currentDay
    ).subscribe(
        posts => {
          if (posts.length > 0) {
            const yearsUsed = [];
            this.posts = [];

            _.each(posts, (post) => {
              const year = moment(post.date).format('YYYY');
              let yearIndex = yearsUsed.indexOf(year);
              if (yearIndex === -1) {
                this.posts.push({ year: year, posts: []});
                yearIndex = yearsUsed.length;
                yearsUsed.push(year);
              }
              this.posts[yearIndex].posts.push(post);
            });
          }
        },
        error => this.errorMessage = <any>error
    );
  }

}

interface PostYearCollection {
  year: string,
  posts: IPost[]
}
