import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'abode-polaroid-profile',
  templateUrl: './polaroid-profile.component.html',
  styleUrls: ['./polaroid-profile.component.scss']
})
export class PolaroidProfileComponent implements OnInit {

  @Input() photo: string;

  constructor() { }

  ngOnInit() {
  }

}
