import { Component, Input, OnInit } from '@angular/core';
import { IPost, DataService } from '../data.service';
import * as mf2 from '../../api/mf2';


@Component({
  selector: 'abode-post-stream',
  templateUrl: './post-stream.component.html',
  styleUrls: ['./post-stream.component.scss']
})
export class PostStreamComponent implements OnInit {

  @Input() postType: mf2.postType[] | 'all';

  posts: IPost[];
  errorMessage: string;

  constructor(private _dataService: DataService) { }

  ngOnInit() {
    this.getPosts()
  }

  getPosts() {
    this._dataService.getPosts({
      limit: 5,
      types: this.postType
    })
      .subscribe(
        posts => {console.log(posts); this.posts = posts},
        error => this.errorMessage = <any>error
      )
  }

}
