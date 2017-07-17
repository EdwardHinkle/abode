import { Component, Input, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { IPost } from '../../api/dataController';
import * as mf2 from '../../api/mf2';

@Component({
  selector: 'abode-post-stream',
  templateUrl: './post-stream.component.html',
  styleUrls: ['./post-stream.component.css']
})
export class PostStreamComponent implements OnInit {

  @Input() postType: mf2.postType[] | 'all';
  @Input() title: 'string';
  @Input() limit: number;

  posts: IPost[];
  errorMessage: string;

  constructor(private _dataService: DataService) { }

  ngOnInit() {
    this.getPosts()
  }

  getPosts() {
    const postFiltering = { limit: undefined, types: undefined };
    if (this.limit) {
      postFiltering.limit = this.limit;
    }
    if (this.postType) {
      postFiltering.types = this.postType;
    }
    this._dataService.getPosts(postFiltering)
      .subscribe(
        posts => {console.log(posts); this.posts = posts},
        error => this.errorMessage = <any>error
      )
  }

}