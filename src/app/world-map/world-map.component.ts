import { Component, AfterViewInit, OnInit, Input, Renderer, ElementRef } from '@angular/core';

@Component({
  selector: 'abode-world-map',
  templateUrl: './world-map.component.html',
  styleUrls: ['./world-map.component.scss']
})
export class WorldMapComponent implements AfterViewInit, OnInit {

  @Input() lat: number;
  @Input() lng: number;
  @Input() name: string;
  @Input() style: 'oldStyle' | 'streets' | 'night' | 'satellite' | 'northStar' | 'oldDark' | 'random';
  mapUrl: string;
  activeMapStyle: string;

  styles: {[key: string]: string};
  randomStyleChoices: [string];

  constructor(private _renderer: Renderer, private _el: ElementRef) {
    this.styles = {
      oldStyle: 'eddiehinkle/cj52i94ja2aq62srwvdjq7rw1',
      night: 'mapbox/traffic-night-v2',
      satellite: 'mapbox/satellite-streets-v10',
      streets: 'mapbox/streets-v9',
      northStar: 'eddiehinkle/cj52ia2i62aqw2ro7spm9px1f',
      oldDark: 'eddiehinkle/cj52ibxzy2ahv2rp4icp5va3a'
    };
    this.randomStyleChoices = ['oldStyle', 'oldDark', 'satellite'];
  }

  ngOnInit() {
    if (this.style === 'random') {
      // Choose a random index from randomStyleChoices and use that array item as the key to the styles object
      this.activeMapStyle = this.styles[this.randomStyleChoices[Math.floor(Math.random() * this.randomStyleChoices.length)]];
    } else {
      this.activeMapStyle = this.styles[this.style];
    }
  }

  ngAfterViewInit() {
    this.mapUrl = `https://api.mapbox.com/styles/v1/${this.activeMapStyle}/static/pin-m+24b1f3(${this.lng},${this.lat})/${this.lng},${this.lat},3,0,60/700x650@2x?access_token=pk.eyJ1IjoiZWRkaWVoaW5rbGUiLCJhIjoiY2oxa3o1aXdiMDAwNDMzbjFjNGQ0ejl1eSJ9.WQZ6i6b-TYYe_96IQ6iXdg&attribution=false&logo=false`;
    this._renderer.setElementStyle(this._el.nativeElement.children[0].children[1], 'background-image', `url('${this.mapUrl}')`);
  }

}
