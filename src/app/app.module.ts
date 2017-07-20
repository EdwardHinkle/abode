import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Local Components
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';


// Local Services
import { DataService } from './data.service';
import { PostStreamComponent } from './post-stream/post-stream.component';
import { PostPageComponent } from './post-page/post-page.component';
import { PostPreviewComponent } from './post-preview/post-preview.component';
import { WorldMapComponent } from './world-map/world-map.component';
import { PolaroidProfileComponent } from './polaroid-profile/polaroid-profile.component';
import { ChannelPageComponent } from './channel-page/channel-page.component';
import { OnThisDayComponent } from './on-this-day/on-this-day.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AboutComponent,
    PostStreamComponent,
    PostPageComponent,
    PostPreviewComponent,
    WorldMapComponent,
    PolaroidProfileComponent,
    ChannelPageComponent,
    OnThisDayComponent
  ],
  imports: [
    BrowserModule.withServerTransition({appId: 'abode'}),
    AppRoutingModule,
    HttpModule,
    BrowserAnimationsModule
  ],
  providers: [DataService],
  bootstrap: [AppComponent]
})
export class AppModule { }
