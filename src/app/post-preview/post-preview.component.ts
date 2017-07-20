import { Component, OnInit, Input } from '@angular/core';
import { IPost } from '../../api/dataController';

@Component({
  selector: 'abode-post-preview',
  templateUrl: './post-preview.component.html',
  styleUrls: ['./post-preview.component.css']
})
export class PostPreviewComponent implements OnInit {

  @Input() post: IPost;

  constructor() { }

  ngOnInit() {
  }

}
