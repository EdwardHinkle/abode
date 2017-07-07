import { Component, OnInit } from '@angular/core';
import { IPost, DataService } from '../data.service';


@Component({
  selector: 'app-post-stream',
  templateUrl: './post-stream.component.html',
  styleUrls: ['./post-stream.component.scss']
})
export class PostStreamComponent implements OnInit {

  posts: IPost[];
  errorMessage: string;

  constructor(private _dataService: DataService) { }

  ngOnInit() {
    this.getPosts()
  }

  getPosts() {
    this._dataService.getPosts({
      count: 5,
      types: ['Article']
    })
      .subscribe(
        posts => {console.log(posts); this.posts = posts},
        error => this.errorMessage = <any>error
      )
  }

}
