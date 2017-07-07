import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {

  constructor(meta: Meta, title: Title) {

    title.setTitle('About me');

    meta.addTags([
      { name: 'author',   content: 'Eddie Hinkle'},
      { name: 'keywords', content: 'eddie, hinkle, software engineer, programming, blog, faith, christianity'},
      { name: 'description', content: 'adsadasdasdasdasdasdsadasd' }
    ]);

  }

  ngOnInit() {
  }

}
