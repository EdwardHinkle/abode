import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { DataService } from '../data.service';
import { IPost } from '../../api/dataController';
import * as mf2 from '../../api/mf2';

@Component({
  selector: 'abode-post-page',
  templateUrl: './post-page.component.html',
  styleUrls: ['./post-page.component.scss']
})
export class PostPageComponent implements OnInit {

  postYear: number;
  postMonth: number;
  postDay: number;
  postIndex: number;

  post: IPost = undefined;
  errorMessage: string = undefined;

  constructor(private router: Router, private route: ActivatedRoute, private _dataService: DataService, meta: Meta, title: Title) {
    this.postYear = route.snapshot.params['year'];
    this.postMonth = route.snapshot.params['month'];
    this.postDay = route.snapshot.params['day'];
    this.postIndex = route.snapshot.params['postIndex'];
    console.log(`Current Route ${router.url}`);

    title.setTitle('Eddie\'s Post');

    meta.addTags([
      { name: 'author',   content: 'Eddie Hinkle'},
      { name: 'keywords', content: 'eddie, hinkle, software engineer, programming, blog, faith, christianity'},
      { name: 'description', content: 'This should be the post description' }
    ]);
  }

  // Map example for routes: https://api.mapbox.com/styles/v1/mapbox/streets-v10/static/pin-s-a+2196f3%28-122.46589,37.77343%29,pin-s-b+43a25c%28-122.42816,37.75965%29,path-5+f44-0.5%28%7DrpeFxbnjVsFwdAvr@cHgFor@jEmAlFmEMwM_FuItCkOi@wc@bg@wBSgM%29/auto/800x400@2x?access_token=pk.eyJ1IjoiZWRkaWVoaW5rbGUiLCJhIjoiY2oxa3o1aXdiMDAwNDMzbjFjNGQ0ejl1eSJ9.WQZ6i6b-TYYe_96IQ6iXdg&before_layer=road-label-small

  ngOnInit() {
    this.getPost()
  }

  getPost() {
    this._dataService.getPostById(this.postYear, this.postMonth, this.postDay, this.postIndex)
        .subscribe(
            posts => {
              console.log('Post retrieved');
              this.post = posts[0];
              // const canonicalPostUrl = this.post.permalink.replace(':year', <string><any>this.postYear)
              //     .replace(':month', <string><any>this.postMonth)
              //     .replace(':day', <string><any>this.postDay)
              //     .replace(':slug', <string><any>this.postIndex);
              // console.log('Check Canonical Post URL');
              // console.log(canonicalPostUrl);
              // if (canonicalPostUrl !== this.router.url) {
              //   this.router.navigateByUrl(canonicalPostUrl);
              // }

            },
            error => this.errorMessage = <any>error
        )
  }

}
