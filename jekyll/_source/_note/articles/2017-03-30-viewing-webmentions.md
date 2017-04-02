---
layout: post
featured: true
title:  "Viewing webmentions"
date:   2017-03-30 10:00:00 -0400
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
For about a week, I've been able to [receive webmentions]({{ site.baseurl }}{% link _note/articles/2017-03-23-receiving-webmentions.md %}) but they haven't been visible on my site. That is a bad experience for several reasons: The first is that it seems strange for someone to send a webmention and if they visit my site later to see that there's no reference to the feedback they sent me. Second, it's not very enjoyable for me to look at my site and then to have to do some behind the scenes stuff to see if anyone has responded to my posts.

So that has all changed now! Currently, my site will display if another site mentions one of my posts (basically just linking to my page without direct reference), if someone writes a specific reply post, and if someone likes a post.

On the technical side of things, I am actually converting any likes to emoji reactions ([reacji](https://indieweb.org/reacji)) of the thumbs-up: 👍. I also check both replies and mentions for content that is equal only to an emoji code. If that is the case, then the reply or mention is also converted to a reaction. All reactions are gathered at the top of the "Responses" area of my site and display the total number of each reaction, as well as a face-pile of each person that sent a reaction with the reaction they sent in the lower left corner.

![Screenshot of reactions example]({{ site.url }}/images/post-images/reactions-example.png)

I also try to display replies as nicely as possible with the author photo, name and date of posting next to their reply text.

![Screenshot of replies example]({{ site.url }}/images/post-images/replies-example.png)

Finally, for mentions, I just point out that another site has mentioned mine. If the site doesn't provide an author name, it just uses the domain.

![Screenshot of mentions example]({{ site.url }}/images/post-images/mentions-example.png)

I'm pretty excited about these advancements. Using emoji reactions in slack is one of my favorite things about it. There are, however, some more things that I want to do for my site that currently isn't the case:
* I also want to expand my webmention views to include when people: bookmark, repost or rsvp/invite.
* Currently webmentions only display on my site when I upload new data. I **have almost** finished building a webmention update script that will run on my server. This will make it so that when I receive a webmention, my jekyll instance will download the new data and auto-rebuild causing it to display within a couple of seconds.
* I have to check all of my posts to know if someone has sent a webmention, I'd like to build that into a native experience in some way soon, hopefully. [Marty](https://martymcgui.re) has done some good work on that, with [this post](https://martymcgui.re/2017/03/29/161441/).