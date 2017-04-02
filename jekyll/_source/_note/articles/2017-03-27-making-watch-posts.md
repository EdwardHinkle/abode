---
layout: post
featured: true
title:  "Making /watch posts"
date:   2017-03-27 01:00:00 -0400
type: article
categories: tech
tags: [tech, indieweb]
duration: 2
permalink: /article/:year/:month/:title.html
syndication:
 - name: IndieNews
   image: images/indiewebcamp.svg
   url: https://news.indieweb.org/en
---
For a couple weeks now, I've been trying to record what TV shows I watch on my site, by creating what in the [IndieWeb](https://indieweb.org) we call a [watch post](https://indieweb.org/watch). I didn't have much tooling set up for this, so it consisted of me doing a lot of manual work. I would create a blank post in Jekyll, my blog engine, which is really just a list of attributes and values, in what is called [YAML](http://yaml.org). I would visit [IMDB](http://imdb.com), search for the show (if it was the first time I checked into this show) and grab the ID from the URL. Then I would visit [The Movie DB](http://themoviedb.com) and grab the URL for the show, the cover image for the show and sometimes the episode image for the show. I would add all of this into my blank file and add other information like the season, episode, date, time that I watched it. It...wasn't very fun.

So today, I took the first step in simplifying this for myself. I created my "Add Media CLI" project which I have made available on [GitHub](https://github.com/EdwardHinkle/node-add-media-cli) for those interested. Basically it allows me to type `npm start -- tv "Designated Survivor"` and it will tell me how many seasons are available. If I add the season number to the end, it will show me a list of episodes in that season, including the episode number, name and date of original airing. Finally, if I provide a full watch post which would look like this: `npm start -- tv "Designated Survivor" 1 13 political` it will automatically create a new watch post inside of my local jekyll blog directory, automatically name it for the show, season and episode and fetch all of the data I was manually entering previously and save that into my watch post. This also works for movies! Which means using this super simple and quick CLI I just went through and entered a bunch of TV shows and Movies that I hadn't bothered entering for the sake of time in and back-dated them to when I watched them. I've been using [trakt.tv](http://trakt.tv) to track my shows/movies for probably 6 months... no I have not imported all 6 months to my blog...yet.

This is just the first step. Step 2 is to create a front-end for the node.js powered CLI in Angular so that it has a visual interface. Step 3 will be to break the media check-in free from my computer by having it produce microformat compatible data to a [micropub](https://indieweb.org/micropub) endpoint that would allow anyone to use it to check in to TV shows and movies on their own [IndieWeb](https://indieweb.org) website.