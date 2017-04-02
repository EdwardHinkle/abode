---
layout: page
title: Indieweb
permalink: /projects/indieweb/
syndication:
 - name: IndieWeb
   image: images/indiewebcamp.svg
   url: https://indieweb.org/User:Eddiehinkle.com
excerpt: Here's a look at how my website complies with IndieWeb standards and what my plans and ideas are for the future of my site and for the IndieWeb.
---
Here's a look at how my website complies with IndieWeb standards and what my plans and ideas are for the future of my site and for the IndieWeb.

## Projects
* [Indigenous]({% link projects/indigenous.md %}) (Under Development) - A iOS and macOS share extension that sends data to a [Micropub](https://indieweb.org/micropub) endpoint. You will download the app, login with IndieAuth, then you can send micropub to your site by using the iOS or macOS share sheet.

## Working On

### Currently Working
* Build a Micropub Endpoint based on [Node-Micropub](https://github.com/voxpelli/node-micropub-express)
* Add support for displaying webmentions

### Itches
* Track [/listen](https://indieweb.org/listen) posts for podcasts with media framents.
* Track [/listen](https://indieweb.org/listen) posts for audiobooks with progress.
* Track [/read](https://indieweb.org/read) posts for online articles.
* Build Jekyll Extension that allows you to trigger a mention of someone or something within your markdown
* Finish [PESOS](https://indieweb.org/PESOS) reading data from Goodreads to my site, build a read page to be my central portal for my reading information.
* Move video posts from YouTube to [POSSE](https://indieweb.org/POSSE)
* Set up PESOS import of Kindle Highlights
* Explore more in-depth watch post type for logging TV and Movies, with /watch portal page.
* Import all the old Tweets, Instagram and Facebook posts after filtering out the irrelevant posts I don't want to keep.
* Begin POSSE processes starting with notes
* Add native support for sending [Webmentions](https://indieweb.org/webmention)
* Build a Year-in-Review page that shows listen, watch and read stats, words written in blog posts, # of replies, # of likes, etc.

### Random Brainstorm Ideas for Future
* **Inscribe**, a Micropub Media Check-in Web App. Start with TV show and Movie check ins. Then move on to books. Allows the user to  search for Episodes of a TV show, a Movie or a Book and mark the status as "Interested, In Progress or Finished". Eventually, maybe it can be expanded to support moving Interested items to In Progress and In Progress items to Finished.
* A video service that uses IndieAuth and Webmentions to invite other users into a private WebRTC video rooms.
* A service that allows you to login via IndieAuth, enter sites that you want to follow via H-Feed and it will send you a daily Kindle newsletter with any new posts from sites you want to follow.
* Lifestream Micropub Syncing app. An iOS app that syncs the Healthkit data that you choose up to your micropub endpoint.
* Explore Read-It-Later style app that utilizes h-feed and micropub with private read posts from your site.
* Explore JavaScript IndieWeb Interactions versus Web Actions.
* What would a modern web browser look/feel like? How do you navigate? How would it integrate with microformats, micropub, etc?

### Completed
* Added support for receiving webmentions
* Added support for replying/citing posts
* Created [watch](https://indieweb.org/watch) posts for shows that I've watched and shows that I'm interested in watching.
* Converted current posts into different collection types that match IndieWeb post types.
* Marked up site content with microformats
* Added basic level of PESOS for Goodreads currently reading and recently read books.
* Set up Web Sign In
* Own my own domain

## Implementation Design
* This site is a standard jekyll site.
	* Currently my site contains the following post types: article, book review, photo, video and RSVPs.
	* I have two types of Jekyll collections: note and media.
    * Note is the general all purpose collection type. Using different attributes based on [post type discovery](https://indieweb.org/post-type-discovery), Jekyll uses different template includes to emulate different post types.
    * The media collection is for the read/watch/listen post types. I created this as a different collection type because it's an area that I plan to do a lot of experimenting in and don't want to lock myself into anything or mess up my other post types while experimenting. I no longer use posts within Jekyll.
  * video is currently just a link to YouTube. #IndieWebFail. That needs to be fixed.
* node.js scripts run in the background to PESOS Goodreads content to my /data directory and periodically rebuilds my Jekyll site with fresh data.
* The goal is to always have a static site as much as possible, with node.js micro services that update my static files as need be. Eventually, if needed, having node.js store data in a database and then whenever data is updated, re-publish static files. I would like to stick with jekyll as long as possible, but if that ever gets to the point that it is too complicated, the goal is to build a node.js module that exports HTML through a template language like Jade.

_Last Updated March 2017_

_For more information on the [IndieWeb](https://indieweb.org)_