import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { HomeComponent } from './home/home.component';
import { PostPageComponent } from './post-page/post-page.component';
import { ChannelPageComponent } from './channel-page/channel-page.component';
import { OnThisDayComponent } from './on-this-day/on-this-day.component';
import { UrlSegment, UrlSegmentGroup, Route, UrlMatchResult } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'about',
    component: AboutComponent
  },
  {
    path: 'onthisday',
    component: OnThisDayComponent
  },
  {
    path: 'onthisday/:month/:day',
    component: OnThisDayComponent
  },
  {
    matcher: channelUrlMatcher,
    component: ChannelPageComponent
  },
  {
    matcher: postUrlMatcher,
    component: PostPageComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

export function channelUrlMatcher(segments: UrlSegment[], group: UrlSegmentGroup, route: Route): UrlMatchResult {

    if (segments.length === 1 &&
        (segments[0].path === 'thoughts' ||
         segments[0].path === 'articles' ||
         segments[0].path === 'photos'
        )) {

        const postParams = {
            'channelId': segments[0]
        };

        return {
            consumed: segments,
            posParams: postParams
        };

    } else {
        return null;
    }
}

export function postUrlMatcher(segments: UrlSegment[], group: UrlSegmentGroup, route: Route): UrlMatchResult {

  if (segments.length >= 4 && segments.length <= 5 &&
      segments[0].path.match(/^[0-9][0-9][0-9][0-9]$/) &&
      segments[1].path.match(/^[0-9][0-9]$/) &&
      segments[2].path.match(/^[0-9][0-9]$/) &&
      segments[3].path.match(/^[0-9]+$/)) {

     const postParams = {
      'year': segments[0],
      'month': segments[1],
      'day': segments[2],
      'postIndex': segments[3],
     };

     if (segments.length === 5) {
       postParams['postSlug'] = segments[4];
     }

    return {
      consumed: segments,
      posParams: postParams
    };

  } else {
    return null;
  }
}
