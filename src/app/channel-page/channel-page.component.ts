import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { DataService } from '../data.service';

@Component({
  selector: 'abode-channel-page',
  templateUrl: './channel-page.component.html',
  styleUrls: ['./channel-page.component.css']
})
export class ChannelPageComponent implements OnInit {

  channelId: string;

  constructor(private router: Router, private route: ActivatedRoute, private _dataService: DataService, meta: Meta, title: Title) {
    this.channelId = route.snapshot.params['channelId'];
  }

  ngOnInit() {
  }

}
