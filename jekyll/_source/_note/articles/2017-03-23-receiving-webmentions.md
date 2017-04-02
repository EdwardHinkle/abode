---
layout: post
featured: true
title:  "Receiving Webmentions"
date:   2017-03-23 10:00:00 -0500
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
Today I added [webmention.io](http://webmention.io) to my website's header. This will allow me to now receiving webmentions from other sites that support it. I haven't gone through the task of actually collecting and displaying them, but the first step is making sure that someone can send me a webmention (A comment, like, rsvp or reaction).

I have two goals for webmentions. The first is to build my website to start feteching webmentions from [webmention.io](http://webmention.io) and to start displaying them at the bottom of posts.

The second is to build a native iOS app that can receiving webmentions from a service like webmention.io (or a person's personal website) and display it as an iOS alert. This would be integrated into the [indigenous]({% link projects/indigenous.md %}) app that I'm working on, but probably won't be integrated until Version 2 in Summer 2017. That would help do for the IndieWeb what the native Twitter and Facebook clients do in allowing you to be notified about what people are talking to you.